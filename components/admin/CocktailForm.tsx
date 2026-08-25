'use client';

import { Cocktail, CocktailIngredient, ParticleEffect } from '@/types/cocktail';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  DEFAULT_PARTICLE_EFFECT,
  PARTICLE_EFFECTS,
  describeDbError,
  isValidAbv,
  isValidOrderIndex,
  isValidSlug,
  ABV_MIN,
  ABV_MAX,
  ORDER_INDEX_MAX,
  SLUG_MAX_LENGTH,
} from '@/lib/form-validation';
import { cocktailMutationPaths } from '@/lib/revalidate-paths';
import { requestPublicRevalidation } from '@/lib/admin-revalidate';
import { sniffFileKind } from '@/lib/file-magic';

// Deterministic snapshot of every editable field — used by the dirty-form
// guard (ADMIN-05) to decide whether leaving would discard work.
function formSignature(data: Partial<Cocktail>, ings: CocktailIngredient[]): string {
  return JSON.stringify([
    data.name ?? null,
    data.slug ?? null,
    data.vibe_title ?? null,
    data.description ?? null,
    data.taste_notes ?? null,
    data.glass_type ?? null,
    typeof data.abv === 'number' && Number.isFinite(data.abv) ? data.abv : null,
    data.theme_color_primary ?? null,
    data.theme_color_secondary ?? null,
    data.liquid_color ?? null,
    data.backdrop_video_url ?? null,
    data.backdrop_image_url ?? null,
    data.spline_scene_url ?? null,
    data.particle_effect ?? null,
    data.is_published === true,
    typeof data.order_index === 'number' && Number.isInteger(data.order_index) ? data.order_index : null,
    ings.map(i => [i.name, i.amount]),
  ]);
}

interface PickedFileInfo {
  name: string;
  sizeLabel: string;
}

export default function CocktailForm({ initialData }: { initialData: Cocktail | null }) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<Partial<Cocktail>>({
    name: initialData?.name || '',
    slug: initialData?.slug || '',
    vibe_title: initialData?.vibe_title || '',
    description: initialData?.description || '',
    taste_notes: initialData?.taste_notes || '',
    glass_type: initialData?.glass_type || 'Highball',
    abv: initialData?.abv ?? 0,
    theme_color_primary: initialData?.theme_color_primary || '#000000',
    theme_color_secondary: initialData?.theme_color_secondary || '#000000',
    liquid_color: initialData?.liquid_color || '#000000',
    backdrop_video_url: initialData?.backdrop_video_url || '',
    backdrop_image_url: initialData?.backdrop_image_url || '',
    spline_scene_url: initialData?.spline_scene_url || '',
    particle_effect: initialData?.particle_effect || DEFAULT_PARTICLE_EFFECT,
    is_published: initialData?.is_published || false,
    ingredients: initialData?.ingredients || [],
    order_index: initialData?.order_index || 0,
  });

  const [ingredients, setIngredients] = useState<CocktailIngredient[]>(formData.ingredients || []);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [pickedImage, setPickedImage] = useState<PickedFileInfo | null>(null);
  const [pickedVideo, setPickedVideo] = useState<PickedFileInfo | null>(null);

  // --- Dirty-form guard (ADMIN-005) ---
  const savedSignature = useRef<string>(formSignature(formData, ingredients));
  const allowNavigationRef = useRef(false);
  const isDirty = useMemo(
    () => formSignature(formData, ingredients) !== savedSignature.current,
    [formData, ingredients]
  );

  // Warn before browser-level exits (tab close, refresh, back).
  useEffect(() => {
    if (!isDirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      // Departure already confirmed via an in-app link — don't prompt twice.
      if (allowNavigationRef.current) return;
      // Navigating away discards unsaved changes.
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [isDirty]);

  // Warn before in-app link navigation ("Back to Dashboard", "View Site", …).
  // Capture phase so it wins over Next.js client-side routing; once the admin
  // confirms, no further prompts fire for that departure.
  useEffect(() => {
    if (!isDirty) return;
    const onLinkClick = (e: MouseEvent) => {
      if (allowNavigationRef.current || e.defaultPrevented) return;
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest?.('a[href]');
      if (!anchor) return;
      const leave = window.confirm('You have unsaved changes. Leave this page without saving?');
      if (!leave) {
        e.preventDefault();
        e.stopPropagation();
      } else {
        allowNavigationRef.current = true;
      }
    };
    document.addEventListener('click', onLinkClick, true);
    return () => document.removeEventListener('click', onLinkClick, true);
  }, [isDirty]);

  const formatSize = (bytes: number): string =>
    bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    // Client-side checks are UX-grade hardening only — they are not a trust
    // boundary. Uploads go browser → Supabase Storage under an authenticated
    // admin session restricted by RLS/storage policies. The media bucket has
    // NO server-side MIME/size enforcement today; tightening that requires a
    // production Storage policy change (explicitly out of scope here).
    // Magic-byte sniffing below catches mislabeled files, but content-type
    // spoofing cannot be fully ruled out without server-side enforcement.
    const input = event.currentTarget;
    try {
      if (!input.files || input.files.length === 0) return;

      const file = input.files[0];
      // Clear the selection so picking the SAME file again re-fires onChange.
      input.value = '';

      const MAX_SIZE = 50 * 1024 * 1024; // 50MB for video/image max
      if (file.size > MAX_SIZE) {
        alert('File is too large. Maximum size is 50MB.');
        return;
      }
      if (type === 'image' && !file.type.startsWith('image/')) {
        alert('Please upload a valid image file.');
        return;
      }
      if (type === 'video' && !file.type.startsWith('video/')) {
        alert('Please upload a valid video file.');
        return;
      }

      // Verify the bytes plausibly match the claimed category. Unknown formats
      // (e.g. SVG, which has no binary signature) still pass via MIME above.
      const sniffed = await sniffFileKind(file);
      if (sniffed && sniffed !== type) {
        alert(`That file doesn't look like a valid ${type}. Please choose a different file.`);
        return;
      }

      const fileExt = file.name.split('.').pop() || 'bin';
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      if (type === 'image') {
        setUploadingImage(true);
        setPickedImage({ name: file.name, sizeLabel: formatSize(file.size) });
      }
      if (type === 'video') {
        setUploadingVideo(true);
        setPickedVideo({ name: file.name, sizeLabel: formatSize(file.size) });
      }

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('media').getPublicUrl(filePath);

      setFormData(prev => ({
        ...prev,
        [type === 'image' ? 'backdrop_image_url' : 'backdrop_video_url']: data.publicUrl
      }));
    } catch (error: unknown) {
      console.error('[CocktailForm] upload failed:', error);
      alert('Error uploading file. Please check your connection and try again.');
    } finally {
      if (type === 'image') setUploadingImage(false);
      if (type === 'video') setUploadingVideo(false);
    }
  };

  const addIngredient = () => {
    setIngredients([...ingredients, { name: '', amount: '' }]);
  };

  const updateIngredient = (index: number, field: 'name' | 'amount', value: string) => {
    const newIngredients = [...ingredients];
    newIngredients[index][field] = value;
    setIngredients(newIngredients);
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // --- Pre-submit validation (ADMIN-004). The database CHECK/UNIQUE
    // constraints remain authoritative; these catch the obvious user errors
    // before a round-trip. ---
    const name = (formData.name || '').trim();
    if (!name) {
      alert('Name is required.');
      return;
    }

    const vibeTitle = (formData.vibe_title || '').trim();
    if (!vibeTitle) {
      alert('Vibe title is required.');
      return;
    }

    const description = (formData.description || '').trim();
    if (!description) {
      alert('Description is required.');
      return;
    }

    const tasteNotes = (formData.taste_notes || '').trim();
    if (!tasteNotes) {
      alert('Taste notes are required.');
      return;
    }

    // Slug must be URL-safe: lowercase letters, digits, single hyphens.
    // A bad slug produces broken /cocktail/<slug> routes.
    const slug = (formData.slug || '').trim();
    if (!isValidSlug(slug)) {
      alert('Slug must be lowercase letters, numbers, and single hyphens (e.g. "mojito-classic").');
      return;
    }
    if (slug.length > SLUG_MAX_LENGTH) {
      alert(`Slug must be at most ${SLUG_MAX_LENGTH} characters.`);
      return;
    }

    if (!isValidAbv(typeof formData.abv === 'number' ? formData.abv : null)) {
      alert(`ABV must be between ${ABV_MIN} and ${ABV_MAX}.`);
      return;
    }

    if (!isValidOrderIndex(formData.order_index)) {
      alert(`Display order must be a whole number between 0 and ${ORDER_INDEX_MAX}.`);
      return;
    }

    if (ingredients.some(ing => !ing.name.trim() || !ing.amount.trim())) {
      alert('Every ingredient needs both a name and an amount.');
      return;
    }

    setLoading(true);

    const payload = {
      ...formData,
      slug,
      ingredients,
    };

    let error;

    if (initialData?.id) {
      const { error: updateError } = await supabase
        .from('cocktails')
        .update(payload)
        .eq('id', initialData.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from('cocktails')
        .insert([payload]);
      error = insertError;
    }

    setLoading(false);

    if (error) {
      // Full detail stays in devtools logging; the admin sees a mapped,
      // human-friendly message with no SQL/schema internals (ADMIN-04).
      console.error('[CocktailForm] save failed:', error);
      alert(describeDbError(error));
    } else {
      // Invalidate ISR-cached public routes AFTER the write succeeded
      // (ADMIN-002). Old slug included so renamed cocktails don't serve stale
      // entries; failure here is non-blocking (60s ISR timer is the backstop).
      await requestPublicRevalidation(
        cocktailMutationPaths({ oldSlug: initialData?.slug ?? null, newSlug: slug })
      );

      // Save succeeded — mark clean so navigating away doesn't warn (ADMIN-05).
      savedSignature.current = formSignature(payload as Partial<Cocktail>, ingredients);
      allowNavigationRef.current = true;

      router.push('/admin');
      router.refresh();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-black" data-dirty={isDirty || undefined}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="cf-name" className="block text-sm font-medium text-gray-700">Name</label>
          <input id="cf-name" type="text" required maxLength={100} value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-3 py-2 border" />
        </div>
        <div>
          <label htmlFor="cf-slug" className="block text-sm font-medium text-gray-700">Slug</label>
          <input id="cf-slug" type="text" required maxLength={100} value={formData.slug} onChange={e => setFormData({ ...formData, slug: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-3 py-2 border" />
        </div>
        <div>
          <label htmlFor="cf-vibe" className="block text-sm font-medium text-gray-700">Vibe Title</label>
          <input id="cf-vibe" type="text" required maxLength={100} value={formData.vibe_title} onChange={e => setFormData({ ...formData, vibe_title: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-3 py-2 border" />
        </div>
        <div>
          <label htmlFor="cf-glass" className="block text-sm font-medium text-gray-700">Glass Type</label>
          <select id="cf-glass" required value={formData.glass_type} onChange={e => setFormData({ ...formData, glass_type: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-3 py-2 border">
            <option value="Highball">Highball</option>
            <option value="Rocks">Rocks</option>
            <option value="Coupe">Coupe</option>
            <option value="Martini">Martini</option>
            <option value="Flute">Flute</option>
            <option value="Hurricane">Hurricane</option>
            <option value="Mug">Mug</option>
            <option value="Wine">Wine</option>
          </select>
        </div>
        <div>
          <label htmlFor="cf-particle-effect" className="block text-sm font-medium text-gray-700">Particle Effect</label>
          {/* Values mirror the DB enum exactly: particle_effect ∈
              ('rain','fire','neon','snow','bokeh','none') — see migration
              20260621000000_create_cocktails.sql (ADMIN-07). */}
          <select
            id="cf-particle-effect"
            required
            value={formData.particle_effect}
            onChange={e => setFormData({ ...formData, particle_effect: e.target.value as ParticleEffect })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-3 py-2 border"
          >
            {PARTICLE_EFFECTS.map(effect => (
              <option key={effect} value={effect}>{effect}</option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <label htmlFor="cf-description" className="block text-sm font-medium text-gray-700">Description</label>
          <textarea id="cf-description" required maxLength={500} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-3 py-2 border" />
        </div>
        <div className="md:col-span-2">
          <label htmlFor="cf-taste" className="block text-sm font-medium text-gray-700">Taste Notes</label>
          <textarea id="cf-taste" required maxLength={250} value={formData.taste_notes} onChange={e => setFormData({ ...formData, taste_notes: e.target.value })} rows={2} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-3 py-2 border" />
        </div>

        {/* Colors */}
        <div>
          <label htmlFor="cf-color-primary" className="block text-sm font-medium text-gray-700">Primary Theme Color</label>
          <input id="cf-color-primary" type="color" required value={formData.theme_color_primary} onChange={e => setFormData({ ...formData, theme_color_primary: e.target.value })} className="mt-1 block w-full h-10 rounded-md border-gray-300 shadow-sm p-1 border" />
        </div>
        <div>
          <label htmlFor="cf-color-secondary" className="block text-sm font-medium text-gray-700">Secondary Theme Color</label>
          <input id="cf-color-secondary" type="color" required value={formData.theme_color_secondary} onChange={e => setFormData({ ...formData, theme_color_secondary: e.target.value })} className="mt-1 block w-full h-10 rounded-md border-gray-300 shadow-sm p-1 border" />
        </div>
        <div>
          <label htmlFor="cf-liquid-color" className="block text-sm font-medium text-gray-700">Liquid Color</label>
          <input id="cf-liquid-color" type="color" required value={formData.liquid_color} onChange={e => setFormData({ ...formData, liquid_color: e.target.value })} className="mt-1 block w-full h-10 rounded-md border-gray-300 shadow-sm p-1 border" />
        </div>
        <div>
          <label htmlFor="cf-abv" className="block text-sm font-medium text-gray-700">ABV (%)</label>
          <input id="cf-abv" type="number" step="0.1" min={ABV_MIN} max={ABV_MAX} value={formData.abv ?? 0} onChange={e => {
            const parsed = parseFloat(e.target.value);
            setFormData({ ...formData, abv: Number.isNaN(parsed) ? null : parsed });
          }} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-3 py-2 border" />
        </div>
        <div>
          <label htmlFor="cf-order" className="block text-sm font-medium text-gray-700">Display Order</label>
          <input id="cf-order" type="number" step="1" min={0} max={ORDER_INDEX_MAX} value={formData.order_index ?? 0} onChange={e => setFormData({ ...formData, order_index: parseInt(e.target.value, 10) || 0 })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-3 py-2 border" />
          <p className="mt-1 text-xs text-gray-500">Lower numbers appear first on the menu.</p>
        </div>

        {/* Media Uploads */}
        <div className="md:col-span-2 space-y-4 border p-4 rounded-md bg-gray-50">
          <h3 className="text-lg font-medium text-gray-900">Background Media</h3>

          <div>
            <label htmlFor="cf-image-url" className="block text-sm font-medium text-gray-700">Backdrop Image URL</label>
            <div className="flex gap-2 mt-1">
              <input id="cf-image-url" type="text" value={formData.backdrop_image_url || ''} onChange={e => setFormData({ ...formData, backdrop_image_url: e.target.value })} className="block w-full rounded-md border-gray-300 shadow-sm px-3 py-2 border" />
              <div className="relative shrink-0">
                <input type="file" accept="image/*" aria-label="Upload backdrop image" onChange={e => handleFileUpload(e, 'image')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" disabled={uploadingImage} />
                <button type="button" tabIndex={-1} className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50" disabled={uploadingImage}>
                  {uploadingImage ? 'Uploading...' : 'Upload Image'}
                </button>
              </div>
            </div>
            {(uploadingImage || pickedImage) && (
              <p className="mt-1 text-xs text-gray-500" role="status">
                {uploadingImage && pickedImage
                  ? `Uploading "${pickedImage.name}" (${pickedImage.sizeLabel})…`
                  : pickedImage
                    ? `Last uploaded: "${pickedImage.name}" (${pickedImage.sizeLabel})`
                    : ''}
              </p>
            )}
            {formData.backdrop_image_url && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={formData.backdrop_image_url}
                alt="Backdrop image preview"
                loading="lazy"
                decoding="async"
                width={160}
                height={90}
                className="mt-2 h-[90px] w-auto max-w-full rounded border border-gray-200 object-cover bg-white"
                onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              />
            )}
          </div>

          <div>
            <label htmlFor="cf-video-url" className="block text-sm font-medium text-gray-700">Backdrop Video URL</label>
            <div className="flex gap-2 mt-1">
              <input id="cf-video-url" type="text" value={formData.backdrop_video_url || ''} onChange={e => setFormData({ ...formData, backdrop_video_url: e.target.value })} className="block w-full rounded-md border-gray-300 shadow-sm px-3 py-2 border" />
              <div className="relative shrink-0">
                <input type="file" accept="video/*" aria-label="Upload backdrop video" onChange={e => handleFileUpload(e, 'video')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" disabled={uploadingVideo} />
                <button type="button" tabIndex={-1} className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50" disabled={uploadingVideo}>
                  {uploadingVideo ? 'Uploading...' : 'Upload Video'}
                </button>
              </div>
            </div>
            {(uploadingVideo || pickedVideo || formData.backdrop_video_url) && (
              <p className="mt-1 text-xs text-gray-500 break-all" role="status">
                {uploadingVideo && pickedVideo
                  ? `Uploading "${pickedVideo.name}" (${pickedVideo.sizeLabel})…`
                  : pickedVideo
                    ? `Last uploaded: "${pickedVideo.name}" (${pickedVideo.sizeLabel}). Video previews are not loaded inline to avoid heavy downloads.`
                    : formData.backdrop_video_url
                      ? 'A backdrop video is set. Video previews are not loaded inline to avoid heavy downloads.'
                      : ''}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="cf-spline-url" className="block text-sm font-medium text-gray-700">Spline Scene URL (Optional)</label>
            <input id="cf-spline-url" type="text" value={formData.spline_scene_url || ''} onChange={e => setFormData({ ...formData, spline_scene_url: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-3 py-2 border" placeholder="https://prod.spline.design/.../scene.splinecode" />
          </div>
        </div>

        {/* Ingredients */}
        <div className="md:col-span-2 border p-4 rounded-md bg-gray-50">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Ingredients</h3>
            <button type="button" onClick={addIngredient} className="px-3 py-1 text-sm bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200">Add Ingredient</button>
          </div>
          <div className="space-y-3">
            {ingredients.map((ing, i) => (
              <div key={i} className="flex gap-3 items-center">
                <input type="text" placeholder="Name" aria-label={`Ingredient ${i + 1} name`} required maxLength={100} value={ing.name} onChange={e => updateIngredient(i, 'name', e.target.value)} className="flex-1 rounded-md border-gray-300 shadow-sm px-3 py-2 border" />
                <input type="text" placeholder="Amount" aria-label={`Ingredient ${i + 1} amount`} required maxLength={50} value={ing.amount} onChange={e => updateIngredient(i, 'amount', e.target.value)} className="w-32 rounded-md border-gray-300 shadow-sm px-3 py-2 border" />
                <button type="button" aria-label={`Remove ingredient ${i + 1}`} onClick={() => removeIngredient(i)} className="p-2 text-red-500 hover:text-red-700 font-bold">✕</button>
              </div>
            ))}
            {ingredients.length === 0 && <p className="text-sm text-gray-500">No ingredients added.</p>}
          </div>
        </div>

        <div className="md:col-span-2 flex items-center">
          <input type="checkbox" id="published" checked={formData.is_published} onChange={e => setFormData({ ...formData, is_published: e.target.checked })} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" />
          <label htmlFor="published" className="ml-2 block text-sm text-gray-900">
            Publish this cocktail (make it visible on the public menu)
          </label>
        </div>
      </div>

      <div className="flex justify-end border-t pt-6">
        <button type="submit" disabled={loading} className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50">
          {loading ? 'Saving...' : 'Save Cocktail'}
        </button>
      </div>
    </form>
  );
}

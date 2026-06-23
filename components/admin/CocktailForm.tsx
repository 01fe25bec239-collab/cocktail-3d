'use client';

import { Cocktail, CocktailIngredient } from '@/types/cocktail';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

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
    abv: initialData?.abv || 0,
    theme_color_primary: initialData?.theme_color_primary || '#000000',
    theme_color_secondary: initialData?.theme_color_secondary || '#000000',
    liquid_color: initialData?.liquid_color || '#000000',
    backdrop_video_url: initialData?.backdrop_video_url || '',
    backdrop_image_url: initialData?.backdrop_image_url || '',
    spline_scene_url: initialData?.spline_scene_url || '',
    particle_effect: initialData?.particle_effect || 'none',
    is_published: initialData?.is_published || false,
    ingredients: initialData?.ingredients || [],
    order_index: initialData?.order_index || 0,
  });

  const [ingredients, setIngredients] = useState<CocktailIngredient[]>(formData.ingredients || []);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    try {
      if (!event.target.files || event.target.files.length === 0) return;
      
      const file = event.target.files[0];

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

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      if (type === 'image') setUploadingImage(true);
      if (type === 'video') setUploadingVideo(true);

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
      if (error instanceof Error) {
        alert(`Error uploading file: ${error.message}`);
      } else {
        alert('Unknown error uploading file');
      }
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
    setLoading(true);

    const payload = {
      ...formData,
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
      alert(`Error saving: ${error.message}`);
    } else {
      router.push('/admin');
      router.refresh();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-black">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <input type="text" required maxLength={100} value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-3 py-2 border" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Slug</label>
          <input type="text" required maxLength={100} value={formData.slug} onChange={e => setFormData({ ...formData, slug: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-3 py-2 border" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Vibe Title</label>
          <input type="text" required maxLength={100} value={formData.vibe_title} onChange={e => setFormData({ ...formData, vibe_title: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-3 py-2 border" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Glass Type</label>
          <select required value={formData.glass_type} onChange={e => setFormData({ ...formData, glass_type: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-3 py-2 border">
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
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea required maxLength={500} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-3 py-2 border" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">Taste Notes</label>
          <textarea required maxLength={250} value={formData.taste_notes} onChange={e => setFormData({ ...formData, taste_notes: e.target.value })} rows={2} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-3 py-2 border" />
        </div>
        
        {/* Colors */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Primary Theme Color</label>
          <input type="color" required value={formData.theme_color_primary} onChange={e => setFormData({ ...formData, theme_color_primary: e.target.value })} className="mt-1 block w-full h-10 rounded-md border-gray-300 shadow-sm p-1 border" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Secondary Theme Color</label>
          <input type="color" required value={formData.theme_color_secondary} onChange={e => setFormData({ ...formData, theme_color_secondary: e.target.value })} className="mt-1 block w-full h-10 rounded-md border-gray-300 shadow-sm p-1 border" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Liquid Color</label>
          <input type="color" required value={formData.liquid_color} onChange={e => setFormData({ ...formData, liquid_color: e.target.value })} className="mt-1 block w-full h-10 rounded-md border-gray-300 shadow-sm p-1 border" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">ABV (%)</label>
          <input type="number" step="0.1" value={formData.abv || 0} onChange={e => setFormData({ ...formData, abv: parseFloat(e.target.value) })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-3 py-2 border" />
        </div>

        {/* Media Uploads */}
        <div className="md:col-span-2 space-y-4 border p-4 rounded-md bg-gray-50">
          <h3 className="text-lg font-medium text-gray-900">Background Media</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Backdrop Image URL</label>
            <div className="flex gap-2 mt-1">
              <input type="text" value={formData.backdrop_image_url || ''} onChange={e => setFormData({ ...formData, backdrop_image_url: e.target.value })} className="block w-full rounded-md border-gray-300 shadow-sm px-3 py-2 border" />
              <div className="relative">
                <input type="file" accept="image/*" onChange={e => handleFileUpload(e, 'image')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" disabled={uploadingImage} />
                <button type="button" className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                  {uploadingImage ? 'Uploading...' : 'Upload Image'}
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Backdrop Video URL</label>
            <div className="flex gap-2 mt-1">
              <input type="text" value={formData.backdrop_video_url || ''} onChange={e => setFormData({ ...formData, backdrop_video_url: e.target.value })} className="block w-full rounded-md border-gray-300 shadow-sm px-3 py-2 border" />
              <div className="relative">
                <input type="file" accept="video/*" onChange={e => handleFileUpload(e, 'video')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" disabled={uploadingVideo} />
                <button type="button" className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                  {uploadingVideo ? 'Uploading...' : 'Upload Video'}
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Spline Scene URL (Optional)</label>
            <input type="text" value={formData.spline_scene_url || ''} onChange={e => setFormData({ ...formData, spline_scene_url: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-3 py-2 border" placeholder="https://prod.spline.design/.../scene.splinecode" />
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
                <input type="text" placeholder="Name" required maxLength={100} value={ing.name} onChange={e => updateIngredient(i, 'name', e.target.value)} className="flex-1 rounded-md border-gray-300 shadow-sm px-3 py-2 border" />
                <input type="text" placeholder="Amount" required maxLength={50} value={ing.amount} onChange={e => updateIngredient(i, 'amount', e.target.value)} className="w-32 rounded-md border-gray-300 shadow-sm px-3 py-2 border" />
                <button type="button" onClick={() => removeIngredient(i)} className="p-2 text-red-500 hover:text-red-700 font-bold">✕</button>
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

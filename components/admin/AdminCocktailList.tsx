'use client';

import { Cocktail } from '@/types/cocktail';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { cocktailMutationPaths } from '@/lib/revalidate-paths';
import { requestPublicRevalidation } from '@/lib/admin-revalidate';

export default function AdminCocktailList({ initialCocktails }: { initialCocktails: Cocktail[] }) {
  const [cocktails, setCocktails] = useState<Cocktail[]>(initialCocktails);
  const [loadingPublishId, setLoadingPublishId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    setCocktails(initialCocktails);
  }, [initialCocktails]);

  const togglePublish = async (id: string, currentStatus: boolean) => {
    if (loadingPublishId) return; // ignore double clicks while a toggle is pending
    // Optimistic update
    setCocktails(prev => prev.map(c => c.id === id ? { ...c, is_published: !currentStatus } : c));
    setLoadingPublishId(id);

    const slug = cocktails.find(c => c.id === id)?.slug;
    const { error } = await supabase
      .from('cocktails')
      .update({ is_published: !currentStatus })
      .eq('id', id);

    setLoadingPublishId(null);

    if (!error) {
      // Publish state flips public visibility — invalidate immediately
      // (ADMIN-002). Non-blocking; ISR timer is the backstop.
      await requestPublicRevalidation(cocktailMutationPaths({ oldSlug: slug ?? null }));
      router.refresh();
    } else {
      // Revert on error
      setCocktails(prev => prev.map(c => c.id === id ? { ...c, is_published: currentStatus } : c));
      alert('Failed to update status');
    }
  };

  const deleteCocktail = async (id: string) => {
    if (deleting) return; // rapid repeated Confirm clicks must not re-issue the request
    setDeleting(true);

    const slug = cocktails.find(c => c.id === id)?.slug;
    const { error } = await supabase.from('cocktails').delete().eq('id', id);

    setDeleting(false);

    if (!error) {
      setCocktails(prev => prev.filter(c => c.id !== id));
      closeDeleteModal();
      await requestPublicRevalidation(cocktailMutationPaths({ oldSlug: slug ?? null }));
      router.refresh();
    } else {
      alert('Failed to delete');
    }
  };

  // --- Delete confirmation dialog (ADMIN-006): focus management + semantics ---
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const openDeleteModal = (id: string, trigger: HTMLButtonElement) => {
    triggerRef.current = trigger;
    setDeleteConfirmId(id);
  };

  const closeDeleteModal = useCallback(() => {
    setDeleteConfirmId(null);
    // Return focus to the Delete button that opened the dialog (if still there).
    requestAnimationFrame(() => {
      if (triggerRef.current?.isConnected) {
        triggerRef.current.focus();
        triggerRef.current = null;
      }
    });
  }, []);

  useEffect(() => {
    if (!deleteConfirmId) return;

    // Initial focus goes to Cancel — the safe choice for a destructive dialog.
    cancelButtonRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (!deleting) closeDeleteModal();
        return;
      }
      // Minimal focus trap: keep Tab cycling inside the dialog.
      if (e.key === 'Tab') {
        const overlay = overlayRef.current;
        if (!overlay) return;
        const focusables = Array.from(
          overlay.querySelectorAll<HTMLElement>('button:not([disabled])')
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement as HTMLElement | null;
        if (e.shiftKey && active === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [deleteConfirmId, deleting, closeDeleteModal]);

  const overlayRef = useRef<HTMLDivElement>(null);
  const cocktailToDelete = cocktails.find(c => c.id === deleteConfirmId);

  return (
    <>
      <ul className="divide-y divide-gray-200" aria-label="Cocktails">
        {cocktails.map((cocktail) => (
          <li key={cocktail.id} className="py-4 flex items-center justify-between hover:bg-gray-50 px-2 transition-colors rounded-md">
            <div className="flex flex-col">
              <span className="text-sm font-bold text-gray-900">{cocktail.name}</span>
              <span className="text-xs text-gray-500">{cocktail.slug}</span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => togglePublish(cocktail.id, cocktail.is_published)}
                disabled={loadingPublishId === cocktail.id}
                className={`px-3 py-1 text-xs font-medium rounded-full disabled:opacity-50 ${cocktail.is_published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
              >
                {loadingPublishId === cocktail.id ? 'Updating...' : (cocktail.is_published ? 'Published' : 'Draft')}
              </button>
              <Link
                href={`/admin/${cocktail.id}/edit`}
                className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
              >
                Edit
              </Link>
              <button
                onClick={e => openDeleteModal(cocktail.id, e.currentTarget)}
                className="text-red-600 hover:text-red-900 text-sm font-medium"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
        {cocktails.length === 0 && (
          <li className="py-4 text-sm text-gray-500 text-center">No cocktails found.</li>
        )}
      </ul>

      {deleteConfirmId && (
        <div
          ref={overlayRef}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onMouseDown={e => {
            // Click on the backdrop itself dismisses (when safe); clicks inside
            // the panel do not.
            if (e.target === e.currentTarget && !deleting) closeDeleteModal();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-modal-title"
            aria-describedby="delete-modal-description"
            className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full mx-4"
          >
            <h3 id="delete-modal-title" className="text-lg font-bold text-gray-900 mb-2">Confirm Deletion</h3>
            <p id="delete-modal-description" className="text-sm text-gray-500 mb-6">
              Are you sure you want to delete{cocktailToDelete ? ` "${cocktailToDelete.name}"` : ' this cocktail'}? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                ref={cancelButtonRef}
                type="button"
                onClick={() => closeDeleteModal()}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={() => deleteCocktail(deleteConfirmId)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md disabled:opacity-50"
              >
                {deleting ? 'Deleting…' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

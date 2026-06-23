const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '../components/admin_v0/cocktail-form-dialog.tsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Add createClient to imports
content = content.replace('import { Button } from "@/components/ui/button"', 
`import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"`);

// 2. Add supabase client and isUploading state
content = content.replace('const [dragActive, setDragActive] = useState(false)', 
`const [dragActive, setDragActive] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const supabase = createClient()`);

// 3. Rewrite handleFiles to upload
const handleFilesOld = `  function handleFiles(files: FileList | null) {
    if (files && files.length > 0) {
      update("backdrop_image_url", files[0].name)
    }
  }`;

const handleFilesNew = `  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const file = files[0];
    setIsUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = \`\${Math.random().toString(36).substring(2, 15)}_\${Date.now()}.\${fileExt}\`;
      const filePath = \`\${fileName}\`;

      const { error: uploadError } = await supabase.storage
        .from('cocktail-media')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('cocktail-media')
        .getPublicUrl(filePath);

      // Simple heuristic to determine if image or video
      if (file.type.startsWith('video/')) {
        update("backdrop_video_url", publicUrl);
      } else {
        update("backdrop_image_url", publicUrl);
      }
    } catch (err: any) {
      console.error('Upload failed:', err);
      alert('Upload failed: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  }`;

content = content.replace(handleFilesOld, handleFilesNew);

// 4. Update the Upload UI to show uploading state and the actual URL instead of mediaName
const uploadUIOld = `{draft.backdrop_image_url ? (
                  <span className="text-sm font-medium text-neutral-700">
                    {draft.backdrop_image_url}
                  </span>
                ) : (
                  <>
                    <span className="text-sm text-neutral-600">
                      Drag & drop a file, or click to browse
                    </span>
                    <span className="text-xs text-neutral-400">
                      PNG, JPG, MP4 up to 50MB
                    </span>
                  </>
                )}`;

const uploadUINew = `{isUploading ? (
                  <span className="text-sm font-medium text-neutral-700">Uploading...</span>
                ) : draft.backdrop_image_url || draft.backdrop_video_url ? (
                  <span className="text-sm font-medium text-neutral-700 break-all max-w-full overflow-hidden text-ellipsis">
                    {draft.backdrop_image_url || draft.backdrop_video_url}
                  </span>
                ) : (
                  <>
                    <span className="text-sm text-neutral-600">Drag & drop a file, or click to browse</span>
                    <span className="text-xs text-neutral-400">PNG, JPG, MP4 up to 50MB</span>
                  </>
                )}`;

content = content.replace(uploadUIOld, uploadUINew);

fs.writeFileSync(file, content);
console.log('Done injecting upload logic.');

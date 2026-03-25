import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { getImageUrl, pb } from "@/lib/pocketbase";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import SearchHeader from "@/components/SearchHeader";
import { ItemsTable } from "@/components/ItemsTable";
import { ItemDialogs } from "@/components/ItemDialogs";
import { useDebounce } from "@/hooks/useDebounce";

async function resizeImageTo720p(file: File): Promise<File> {
  // Target maximum resolution 1280x720 while keeping aspect ratio
  const MAX_WIDTH = 1280;
  const MAX_HEIGHT = 720;

  const imageBitmap = await createImageBitmap(file);

  let { width, height } = imageBitmap;

  const widthRatio = MAX_WIDTH / width;
  const heightRatio = MAX_HEIGHT / height;
  const scale = Math.min(1, widthRatio, heightRatio);

  // If image is already smaller than or equal to 720p bounds, keep original
  if (scale === 1) {
    return file;
  }

  const targetWidth = Math.round(width * scale);
  const targetHeight = Math.round(height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return file;
  }

  ctx.drawImage(imageBitmap, 0, 0, targetWidth, targetHeight);

  const blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob(
      (result) => resolve(result),
      "image/jpeg",
      0.8 // quality
    )
  );

  if (!blob) {
    return file;
  }

  return new File([blob], file.name, { type: "image/jpeg" });
}

export default function Items() {
  const navigate = useNavigate();

  const [items, setItems] = useState<any>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Debounce search term with 300ms delay
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // CRUD Dialog state
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [currentItem, setCurrentItem] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    name: "",
    bestand: "",
    organisation: [] as string[],
    Anmerkungen: "",
    kiste: "",
    bild: null as File | null
  });

  useEffect(() => {
    fetchItems();
  }, []);

  // Trigger search when debounced search term changes
  useEffect(() => {
    fetchItems(debouncedSearchTerm);
  }, [debouncedSearchTerm]);

  const fetchItems = async (search = "") => {
    setIsLoading(true);
    try {
      pb.autoCancellation(false);

      let filter = "";
      if (search.trim()) {
        filter = `name ~ "${search}"`;
      }

      const resultList = await pb.collection("items").getFullList({
        filter: filter,
        sort: "name",
        expand: "kiste",
      });
      setItems(resultList);
    } catch (error) {
      console.error("Error fetching items:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchItems(searchTerm);
  };

  // Reset form data
  const resetForm = () => {
    setFormData({
      name: "",
      bestand: "",
      organisation: [],
      Anmerkungen: "",
      kiste: "",
      bild: null
    });
  };

  // Open create dialog
  const handleCreate = () => {
    resetForm();
    setDialogMode('create');
    setCurrentItem(null);
    setIsItemDialogOpen(true);
  };

  // Open edit dialog
  const handleEdit = (item: any) => {
    setFormData({
      name: item.name || "",
      bestand: item.bestand?.toString() || "",
      organisation: Array.isArray(item.organisation) ? item.organisation : [],
      Anmerkungen: item.Anmerkungen || "",
      kiste: item.kiste || "",
      bild: null
    });
    setDialogMode('edit');
    setCurrentItem(item);
    setIsItemDialogOpen(true);
  };

  // Open delete dialog
  const handleDelete = (item: any) => {
    setCurrentItem(item);
    setIsDeleteDialogOpen(true);
  };

  // Save item (create or update)
  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert("Name ist erforderlich");
      return;
    }

    setIsSaving(true);
    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('bestand', formData.bestand || '0');
      data.append('Anmerkungen', formData.Anmerkungen);
      data.append('kiste', formData.kiste);
      
      // Handle organisation as array
      if (formData.organisation && formData.organisation.length > 0) {
        formData.organisation.forEach(org => data.append('organisation', org));
      }

      if (formData.bild) {
        const resizedImage = await resizeImageTo720p(formData.bild);
        data.append('bild', resizedImage);
      }

      if (dialogMode === 'create') {
        await pb.collection('items').create(data);
      } else {
        await pb.collection('items').update(currentItem.id, data);
      }

      setIsItemDialogOpen(false);
      fetchItems(searchTerm);
    } catch (error) {
      console.error('Error saving item:', error);
      alert('Fehler beim Speichern des Gegenstands');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete item
  const handleConfirmDelete = async () => {
    if (!currentItem) return;

    setIsSaving(true);
    try {
      await pb.collection('items').delete(currentItem.id);
      setIsDeleteDialogOpen(false);
      fetchItems(searchTerm);
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Fehler beim Löschen des Gegenstands. Der Gegenstand darf kein Teil einer Entnahme sein.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle form data changes
  const handleFormDataChange = (newFormData: typeof formData) => {
    setFormData(newFormData);
  };

  // Handle image modal
  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setIsImageModalOpen(true);
  };

  return (
    <div className='min-h-screen bg-gray-50 p-4'>
      <div className='max-w-4xl mx-auto space-y-6'>
        {/* Search Header */}
        <SearchHeader
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          onSearch={handleSearch}
          isLoading={isLoading}
          placeholder="Gegenstände suchen..."
        />
        
        {/* Items Table */}
        <ItemsTable
          items={items}
          isLoading={isLoading}
          searchTerm={searchTerm}
          onCreateItem={handleCreate}
          onEditItem={handleEdit}
          onDeleteItem={handleDelete}
          onImageClick={handleImageClick}
          onInventur={() => navigate('/inventur')}
        />
      </div>

      {/* Image Modal */}
      <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
        <DialogContent className='p-3'>
          {selectedImage && (
            <img
              src={selectedImage}
              alt='Item'
              className='max-w-full max-h-full '
            />
          )}
        </DialogContent>
      </Dialog>

      {/* CRUD Dialogs */}
      <ItemDialogs
        isItemDialogOpen={isItemDialogOpen}
        setIsItemDialogOpen={setIsItemDialogOpen}
        dialogMode={dialogMode}
        formData={formData}
        onFormDataChange={handleFormDataChange}
        onSave={handleSave}
        isSaving={isSaving}
        isDeleteDialogOpen={isDeleteDialogOpen}
        setIsDeleteDialogOpen={setIsDeleteDialogOpen}
        currentItem={currentItem}
        onConfirmDelete={handleConfirmDelete}
      />
    </div>
  );
}

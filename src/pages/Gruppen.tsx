import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { pb } from "@/lib/pocketbase";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { GruppenTable } from "@/components/GruppenTable";
import { GruppenDialogs } from "@/components/GruppenDialogs";
import SearchHeader from "@/components/SearchHeader";

export default function Gruppen() {
  const { user } = useAuth();

  const [gruppen, setGruppen] = useState<any>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // CRUD Dialog state
  const [isGruppeDialogOpen, setIsGruppeDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [currentGruppe, setCurrentGruppe] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    name: "",
    regal: "",
    kiste: ""
  });

  useEffect(() => {
    fetchGruppen();
  }, []);

  const fetchGruppen = async (search = "") => {
    setIsLoading(true);
    try {
      let filter = "";
      if (search) {
        filter = `name ~ "${search}"`;
      }

      const resultList = await pb.collection("gruppen").getList(1, 50, {
        filter,
        sort: "name",
      });

      setGruppen(resultList.items);
    } catch (error) {
      console.error("Error fetching gruppen:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchGruppen(searchTerm);
  };

  // Reset form data
  const resetForm = () => {
    setFormData({
      name: "",
      regal: "",
      kiste: ""
    });
  };

  // Open create dialog
  const handleCreate = () => {
    resetForm();
    setDialogMode('create');
    setCurrentGruppe(null);
    setIsGruppeDialogOpen(true);
  };

  // Open edit dialog
  const handleEdit = (gruppe: any) => {
    setFormData({
      name: gruppe.name || "",
      regal: gruppe.regal?.toString() || "",
      kiste: gruppe.kiste?.toString() || ""
    });
    setDialogMode('edit');
    setCurrentGruppe(gruppe);
    setIsGruppeDialogOpen(true);
  };

  // Open delete dialog
  const handleDelete = (gruppe: any) => {
    setCurrentGruppe(gruppe);
    setIsDeleteDialogOpen(true);
  };

  // Save gruppe (create or update)
  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert("Name ist erforderlich");
      return;
    }

    setIsSaving(true);
    try {
      const data = {
        name: formData.name,
        regal: parseInt(formData.regal) || 0,
        kiste: parseInt(formData.kiste) || 0
      };

      if (dialogMode === 'create') {
        await pb.collection('gruppen').create(data);
      } else {
        await pb.collection('gruppen').update(currentGruppe.id, data);
      }

      setIsGruppeDialogOpen(false);
      fetchGruppen(searchTerm);
    } catch (error) {
      console.error('Error saving gruppe:', error);
      alert('Fehler beim Speichern der Gruppe');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete gruppe
  const handleConfirmDelete = async () => {
    if (!currentGruppe) return;

    setIsSaving(true);
    try {
      await pb.collection('gruppen').delete(currentGruppe.id);
      setIsDeleteDialogOpen(false);
      fetchGruppen(searchTerm);
    } catch (error) {
      console.error('Error deleting gruppe:', error);
      alert('Fehler beim Löschen der Gruppe');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle form data changes
  const handleFormDataChange = (newFormData: typeof formData) => {
    setFormData(newFormData);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Nicht angemeldet
          </h1>
          <p className="text-gray-600 mb-6">
            Sie müssen sich anmelden, um Gruppen zu verwalten.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            Zur Anmeldung
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50 p-4'>
      <div className='max-w-4xl mx-auto space-y-6'>
        {/* Search Header */}
        <SearchHeader
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          onSearch={handleSearch}
          isLoading={isLoading}
          placeholder="Gruppen suchen..."
        />
        
        {/* Gruppen Table */}
        <GruppenTable
          gruppen={gruppen}
          isLoading={isLoading}
          searchTerm={searchTerm}
          onCreateGruppe={handleCreate}
          onEditGruppe={handleEdit}
          onDeleteGruppe={handleDelete}
        />
      </div>

      {/* CRUD Dialogs */}
      <GruppenDialogs
        isGruppeDialogOpen={isGruppeDialogOpen}
        setIsGruppeDialogOpen={setIsGruppeDialogOpen}
        dialogMode={dialogMode}
        formData={formData}
        onFormDataChange={handleFormDataChange}
        onSave={handleSave}
        isSaving={isSaving}
        isDeleteDialogOpen={isDeleteDialogOpen}
        setIsDeleteDialogOpen={setIsDeleteDialogOpen}
        currentGruppe={currentGruppe}
        onConfirmDelete={handleConfirmDelete}
      />
    </div>
  );
}
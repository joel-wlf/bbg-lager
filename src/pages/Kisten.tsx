import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { pb } from "@/lib/pocketbase";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { KistenTable } from "@/components/KistenTable";
import { KistenDialogs } from "@/components/KistenDialogs";
import SearchHeader from "@/components/SearchHeader";
import { useDebounce } from "@/hooks/useDebounce";

export default function Kisten() {
  const { user } = useAuth();

  const [kisten, setKisten] = useState<any>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [organisationFilter, setOrganisationFilter] = useState<string | null>(null);
  const [kistenOrgs, setKistenOrgs] = useState<Map<string, string[]>>(new Map());
  const [kistenItemCounts, setKistenItemCounts] = useState<Map<string, number>>(new Map());
  const [isLoading, setIsLoading] = useState(false);

  // Debounce search term with 300ms delay
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // CRUD Dialog state
  const [isKisteDialogOpen, setIsKisteDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [currentKiste, setCurrentKiste] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    name: "",
    regal: "",
    stellplatz: ""
  });

  useEffect(() => {
    fetchKisten();
  }, []);

  // Trigger search when debounced search term or org filter changes
  useEffect(() => {
    fetchKisten(debouncedSearchTerm, organisationFilter);
  }, [debouncedSearchTerm, organisationFilter]);

  const fetchKisten = async (search = "", orgFilter: string | null = null) => {
    setIsLoading(true);
    try {
      pb.autoCancellation(false);

      // Fetch items (minimal fields) to compute per-kiste org membership
      const allItems = await pb.collection("items").getFullList({
        fields: "kiste,organisation",
      });

      const orgMap = new Map<string, Set<string>>();
      const countMap = new Map<string, number>();
      for (const item of allItems) {
        if (item.kiste) {
          countMap.set(item.kiste, (countMap.get(item.kiste) ?? 0) + 1);
          if (Array.isArray(item.organisation)) {
            if (!orgMap.has(item.kiste)) orgMap.set(item.kiste, new Set());
            for (const org of item.organisation) orgMap.get(item.kiste)!.add(org);
          }
        }
      }

      const newKistenOrgs = new Map<string, string[]>();
      for (const [id, orgs] of orgMap) newKistenOrgs.set(id, Array.from(orgs).sort());
      setKistenOrgs(newKistenOrgs);
      setKistenItemCounts(countMap);

      const filters: string[] = [];
      if (search) filters.push(`name ~ "${search}"`);

      if (orgFilter) {
        const matchingIds = Array.from(orgMap.entries())
          .filter(([, orgs]) => orgs.has(orgFilter))
          .map(([id]) => id);

        if (matchingIds.length === 0) {
          setKisten([]);
          setIsLoading(false);
          return;
        }
        filters.push(`(${matchingIds.map(id => `id = "${id}"`).join(" || ")})`);
      }

      const resultList = await pb.collection("kisten").getList(1, 50, {
        filter: filters.join(" && "),
        sort: "name",
      });

      setKisten(resultList.items);
    } catch (error) {
      console.error("Error fetching kisten:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchKisten(searchTerm, organisationFilter);
  };

  // Reset form data
  const resetForm = () => {
    setFormData({
      name: "",
      regal: "",
      stellplatz: ""
    });
  };

  // Open create dialog
  const handleCreate = () => {
    resetForm();
    setDialogMode('create');
    setCurrentKiste(null);
    setIsKisteDialogOpen(true);
  };

  // Open edit dialog
  const handleEdit = (kiste: any) => {
    setFormData({
      name: kiste.name || "",
      regal: kiste.regal?.toString() || "",
      stellplatz: kiste.stellplatz?.toString() || ""
    });
    setDialogMode('edit');
    setCurrentKiste(kiste);
    setIsKisteDialogOpen(true);
  };

  // Open delete dialog
  const handleDelete = (kiste: any) => {
    setCurrentKiste(kiste);
    setIsDeleteDialogOpen(true);
  };

  // Save kiste (create or update)
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
        stellplatz: parseInt(formData.stellplatz) || 0
      };

      if (dialogMode === 'create') {
        await pb.collection('kisten').create(data);
      } else {
        await pb.collection('kisten').update(currentKiste.id, data);
      }

      setIsKisteDialogOpen(false);
      fetchKisten(searchTerm, organisationFilter);
    } catch (error) {
      console.error('Error saving kiste:', error);
      alert('Fehler beim Speichern der Kiste');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete kiste
  const handleConfirmDelete = async () => {
    if (!currentKiste) return;

    setIsSaving(true);
    try {
      await pb.collection('kisten').delete(currentKiste.id);
      setIsDeleteDialogOpen(false);
      fetchKisten(searchTerm, organisationFilter);
    } catch (error) {
      console.error('Error deleting kiste:', error);
      alert('Fehler beim Löschen der Kiste. Die Kiste darf keine Gegenstände enthalten.');
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
            Sie müssen sich anmelden, um Kisten zu verwalten.
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
          placeholder="Kisten suchen..."
        />
        
        {/* Kisten Table */}
        <KistenTable
          kisten={kisten}
          isLoading={isLoading}
          searchTerm={searchTerm}
          organisationFilter={organisationFilter}
          kistenOrgs={kistenOrgs}
          kistenItemCounts={kistenItemCounts}
          onOrganisationFilterChange={setOrganisationFilter}
          onCreateKiste={handleCreate}
          onEditKiste={handleEdit}
          onDeleteKiste={handleDelete}
        />
      </div>

      {/* CRUD Dialogs */}
      <KistenDialogs
        isKisteDialogOpen={isKisteDialogOpen}
        setIsKisteDialogOpen={setIsKisteDialogOpen}
        dialogMode={dialogMode}
        formData={formData}
        onFormDataChange={handleFormDataChange}
        onSave={handleSave}
        isSaving={isSaving}
        isDeleteDialogOpen={isDeleteDialogOpen}
        setIsDeleteDialogOpen={setIsDeleteDialogOpen}
        currentKiste={currentKiste}
        onConfirmDelete={handleConfirmDelete}
      />
    </div>
  );
}
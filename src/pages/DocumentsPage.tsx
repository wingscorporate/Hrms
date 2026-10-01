import React, { useState } from 'react';
import { 
  FileText, 
  Upload, 
  Download, 
  Trash2, 
  Eye, 
  Search, 
  Filter, 
  X, 
  ShieldCheck, 
  FolderLock,
  Plus
} from 'lucide-react';
import { useHRMS } from '../context/HRMSContext';
import { DocumentCategory, DocumentItem } from '../types';
import { Avatar } from '../components/common/Avatar';

export const DocumentsPage: React.FC = () => {
  const { documents, employees, currentUser, uploadDocument, deleteDocument } = useHRMS();

  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);

  // Upload Form
  const [title, setTitle] = useState('');
  const [employeeId, setEmployeeId] = useState(currentUser?.employeeId || 'emp-5');
  const [category, setCategory] = useState<DocumentCategory>('Identity Documents');
  const [fileName, setFileName] = useState('');

  const canManageAll = currentUser?.role === 'super_admin' || currentUser?.role === 'hr';

  const categories: DocumentCategory[] = [
    'Identity Documents',
    'Employment Documents',
    'Salary Documents',
    'Certificates',
    'Company Documents',
    'Other Documents'
  ];

  const filteredDocs = documents.filter(doc => {
    // If not admin/HR, can only see own docs or Company Documents
    if (!canManageAll && doc.employeeId !== currentUser?.employeeId && doc.category !== 'Company Documents') {
      return false;
    }

    const matchesCat = categoryFilter === 'all' || doc.category === categoryFilter;
    const matchesSearch = !search ||
      doc.title.toLowerCase().includes(search.toLowerCase()) ||
      doc.fileName.toLowerCase().includes(search.toLowerCase());

    return matchesCat && matchesSearch;
  });

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !fileName.trim()) return;

    uploadDocument({
      title,
      fileName,
      fileSize: `${(Math.random() * 2 + 0.8).toFixed(1)} MB`,
      category,
      employeeId,
      fileType: 'application/pdf'
    });

    setIsUploadModalOpen(false);
    setTitle('');
    setFileName('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Document Vault & Compliance</h1>
            <span className="text-xs font-semibold px-2 py-0.5 bg-blue-50 text-[#365CF5] rounded-full border border-blue-100 font-mono">
              {documents.length} Files
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Encrypted storage for Aadhaar, PAN, appointment contracts, NDA forms, and corporate charters.
          </p>
        </div>

        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-[#1D2B45] hover:bg-slate-800 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-2xs"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Upload Document</span>
        </button>
      </div>

      {/* Filter and Category Pills */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
              categoryFilter === 'all' ? 'bg-[#1D2B45] text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Vault ({documents.length})
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
                categoryFilter === cat ? 'bg-[#1D2B45] text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {cat.replace(' Documents', '')}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search document name..."
            className="pl-8 pr-2.5 py-1.5 border border-slate-200 rounded-lg bg-white w-full sm:w-56 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4 font-semibold">Document Title</th>
                <th className="py-3 px-3 font-semibold">Associated Employee</th>
                <th className="py-3 px-3 font-semibold">Category</th>
                <th className="py-3 px-3 font-semibold">Upload Date</th>
                <th className="py-3 px-3 font-semibold">Uploaded By</th>
                <th className="py-3 px-3 font-semibold font-mono">Size</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No documents found in this view
                  </td>
                </tr>
              ) : (
                filteredDocs.map(doc => {
                  const emp = employees.find(e => e.id === doc.employeeId);
                  return (
                    <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 bg-blue-50 text-[#365CF5] rounded-lg shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 hover:text-[#365CF5] cursor-pointer" onClick={() => setPreviewDoc(doc)}>
                              {doc.title}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">{doc.fileName}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        {emp ? (
                          <div className="flex items-center gap-2">
                            <Avatar
                              name={emp.fullName}
                              size="xs"
                            />
                            <span className="text-slate-700 font-medium">{emp.fullName}</span>
                          </div>
                        ) : (
                          <span className="text-slate-500 italic">Corporate Wide</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {doc.category}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600">{doc.uploadDate}</td>
                      <td className="py-3 px-3 text-slate-600">{doc.uploadedByName}</td>
                      <td className="py-3 px-3 font-mono text-slate-500">{doc.fileSize}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => setPreviewDoc(doc)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded"
                            title="Preview file"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => alert(`Downloading verified document: ${doc.fileName}`)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded"
                            title="Download file"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          {canManageAll && (
                            <button
                              onClick={() => {
                                if (confirm(`Are you sure you want to permanently delete "${doc.title}"?`)) {
                                  deleteDocument(doc.id);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                              title="Delete file"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div 
            className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Upload to Wings Vault</h3>
              <button onClick={() => setIsUploadModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Document Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Master Services NDA Agreement"
                  className="w-full p-2 border border-slate-300 rounded-lg outline-hidden focus:ring-1 focus:ring-[#365CF5]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">File Name *</label>
                <input
                  type="text"
                  required
                  value={fileName}
                  onChange={e => setFileName(e.target.value)}
                  placeholder="e.g. nda_signed_wc005.pdf"
                  className="w-full p-2 border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as DocumentCategory)}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                  >
                    {categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Associated Employee</label>
                  <select
                    value={employeeId}
                    onChange={e => setEmployeeId(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                  >
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.fullName}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-4 border-2 border-dashed border-slate-300 rounded-xl text-center bg-slate-50">
                <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                <span className="text-xs font-semibold text-slate-700 block">Drag and drop file here, or browse</span>
                <span className="text-[10px] text-slate-400">Supported: PDF, PNG, JPG, DOCX (Max 25MB)</span>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-3.5 py-2 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1D2B45] hover:bg-slate-800 text-white rounded-lg font-bold cursor-pointer"
                >
                  Encrypt & Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div 
            className="w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">{previewDoc.title}</h3>
                <div className="text-[11px] text-slate-500 font-mono">{previewDoc.fileName} · {previewDoc.fileSize}</div>
              </div>
              <button onClick={() => setPreviewDoc(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 text-center space-y-4">
              <div className="w-20 h-20 bg-blue-50 text-[#365CF5] rounded-2xl mx-auto flex items-center justify-center border border-blue-100">
                <FileText className="w-10 h-10" />
              </div>
              <div>
                <div className="font-bold text-slate-900 text-sm">Verified Wings Vault Artifact</div>
                <div className="text-xs text-slate-500 mt-1">
                  Category: <strong>{previewDoc.category}</strong> · Uploaded on {previewDoc.uploadDate} by {previewDoc.uploadedByName}
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-left text-xs font-mono text-slate-600">
                SHA-256 Checksum: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
              </div>

              <div className="pt-2 flex items-center justify-center gap-3">
                <button
                  onClick={() => alert(`Downloading verified document ${previewDoc.fileName}`)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#1D2B45] hover:bg-slate-800 text-white rounded-lg text-xs font-semibold"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Document</span>
                </button>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import { useState, useRef } from 'react';
import { useImportNutrition } from '../api/hooks';
import Modal from '../components/Modal';
import Button from '../components/Button';
import toast from 'react-hot-toast';

export default function ImportCSV({ isOpen, onClose }) {
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);
  const importNutrition = useImportNutrition();

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped?.name.endsWith('.csv') || dropped?.name.endsWith('.zip')) {
      setFile(dropped);
    } else {
      toast.error('Please drop a CSV or ZIP file');
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleImport = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const result = await importNutrition.mutateAsync(formData);
      const count = result.imported_count || 0;
      const skipped = result.skipped || 0;
      let msg = `Imported ${count} entries`;
      if (skipped > 0) msg += ` (${skipped} duplicates skipped)`;
      toast.success(msg);
      setFile(null);
      onClose();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Import Nutrition CSV">
      <div className="space-y-4">
        <p className="text-sm text-gray-400">
          Upload your MyFitnessPal export (ZIP or CSV). Go to MFP &gt; Settings &gt; Export Data,
          then upload the ZIP you receive via email.
        </p>

        {/* Drop zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
            dragOver
              ? 'border-cyan-400 bg-cyan-500/5'
              : file
              ? 'border-emerald-400/30 bg-emerald-400/5'
              : 'border-dark-500 hover:border-dark-400'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".csv,.zip"
            onChange={handleFileChange}
            className="hidden"
          />
          {file ? (
            <div>
              <svg className="w-8 h-8 text-emerald-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-gray-200">{file.name}</p>
              <p className="text-xs text-gray-500 mt-1">
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
          ) : (
            <div>
              <svg className="w-8 h-8 text-gray-600 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-sm text-gray-400">
                Drop your CSV here or <span className="text-cyan-400">browse</span>
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <Button
            onClick={handleImport}
            loading={importNutrition.isPending}
            disabled={!file}
            size="lg"
            className="flex-1"
          >
            Import
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
}

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  itemsPerPage, 
  totalItems, 
  startIndex 
}) {
  if (totalItems === 0) return null;

  const handlePrevPage = () => {
    onPageChange(Math.max(currentPage - 1, 1));
  };

  const handleNextPage = () => {
    onPageChange(Math.min(currentPage + 1, totalPages));
  };

  return (
    <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50/50">
      <div className="text-sm text-gray-500">
        Menampilkan <span className="font-medium text-gray-700">{startIndex + 1}</span> sampai{" "}
        <span className="font-medium text-gray-700">
          {Math.min(startIndex + itemsPerPage, totalItems)}
        </span>{" "}
        dari <span className="font-medium text-gray-700">{totalItems}</span> data
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={handlePrevPage}
          disabled={currentPage === 1}
          className={`p-2 rounded-lg border transition-all ${
            currentPage === 1
              ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200"
              : "bg-white text-gray-700 hover:bg-gray-50 border-gray-300 shadow-sm active:scale-95"
          }`}
        >
          <ChevronLeft size={18} />
        </button>
        
        <div className="flex items-center gap-1">
          {[...Array(totalPages)].map((_, i) => {
            const pageNum = i + 1;
            // Simple logic to show current, first, last, and surrounding pages
            if (
              pageNum === 1 ||
              pageNum === totalPages ||
              (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
            ) {
              return (
                <button
                  key={pageNum}
                  onClick={() => onPageChange(pageNum)}
                  className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-semibold transition-all ${
                    currentPage === pageNum
                      ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                      : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-300 shadow-sm active:scale-95"
                  }`}
                >
                  {pageNum}
                </button>
              );
            } else if (
              (pageNum === currentPage - 2 && pageNum > 1) ||
              (pageNum === currentPage + 2 && pageNum < totalPages)
            ) {
              return <span key={pageNum} className="px-1 text-gray-400">...</span>;
            }
            return null;
          })}
        </div>

        <button
          onClick={handleNextPage}
          disabled={currentPage === totalPages}
          className={`p-2 rounded-lg border transition-all ${
            currentPage === totalPages
              ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200"
              : "bg-white text-gray-700 hover:bg-gray-50 border-gray-300 shadow-sm active:scale-95"
          }`}
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}

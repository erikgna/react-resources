interface Props {
  currentPage: number;
  totalPages: number;
  nextPage: () => void;
  prevPage: () => void;
  goToPage: (page: number) => void;
}

export default function Pagination({
  currentPage,
  totalPages,
  nextPage,
  prevPage,
  goToPage,
}: Props) {
  const startPage = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
  const endPage = Math.min(totalPages, startPage + 4);

  const pages = [];
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <nav className="flex items-center justify-center space-x-1 mt-8" aria-label="Pagination">
      <button
        disabled={currentPage === 1}
        onClick={prevPage}
        className="px-3 py-2 rounded-md border text-sm font-medium transition-colors cursor-pointer
                   disabled:opacity-50 disabled:cursor-not-allowed
                   hover:bg-gray-50 border-gray-300 text-gray-700"
      >
        Prev
      </button>

      <div className="flex items-center space-x-1">
        {pages.map((page) => (
          <button
            key={page}
            onClick={() => goToPage(page)}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-all duration-200 cursor-pointer
              ${page === currentPage
                ? "bg-blue-600 text-white shadow-sm scale-110"
                : "text-gray-700 hover:bg-blue-50 hover:text-blue-600 border border-transparent hover:border-blue-200"
              }`}
          >
            {page}
          </button>
        ))}
      </div>

      <button
        disabled={currentPage === totalPages}
        onClick={nextPage}
        className="px-3 py-2 rounded-md border text-sm font-medium transition-colors cursor-pointer
                   disabled:opacity-50 disabled:cursor-not-allowed
                   hover:bg-gray-50 border-gray-300 text-gray-700"
      >
        Next
      </button>
    </nav>
  );
}
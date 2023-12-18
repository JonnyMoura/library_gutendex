import React, { useState, useEffect } from 'react';

const API_BASE_URL = 'https://gutendex.com';

async function fetchPage(url) {
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching page:', error);
    return { count: 0, next: null, previous: null, results: [] };
  }
}

async function getBookList(sortOrder = 'popular', page = 1) {
  const url = `${API_BASE_URL}/books?sort=${sortOrder}&page=${page}`;
  return fetchPage(url);
}

async function searchBooks(query, searchType, sortOrder = 'descending_popular', page = 1) {
  const validSearchTypes = ['topic', 'default'];
  if (!validSearchTypes.includes(searchType)) {
    console.error('Invalid search type.');
    return Promise.reject('Invalid search type.');
  }

  let url;

  if (searchType === 'topic') {
    // Searching by topic requires a different query parameter
    url = `${API_BASE_URL}/books?topic=${encodeURIComponent(query)}&sort=${sortOrder}&page=${page}`;
  } else {
    url = `${API_BASE_URL}/books?search=${encodeURIComponent(query)}&sort=${sortOrder}&page=${page}`;
  }

  return fetchPage(url);
}

async function sortBooks(books, sortOrder) {
  switch (sortOrder) {
    case 'ascending_popular':
      return books.slice().sort((a, b) => a.download_count - b.download_count);

    case 'descending_popular':
      return books.slice().sort((a, b) => b.download_count - a.download_count);

    case 'alphabetical':
      return books.slice().sort((a, b) => a.title.localeCompare(b.title));

    case 'reverse_alphabetical':
      return books.slice().sort((a, b) => b.title.localeCompare(a.title));

    default:
      console.error('Invalid sort order.');
      return books;
  }
}

function filterBooks(books, filterType, filterValue) {
  if (!filterType || !filterValue) {
    return books;
  }

  switch (filterType) {
    case 'language':
      const languages = Array.from(new Set(books.flatMap(book => book.languages)));
      return books.filter(book => book.languages.includes(filterValue));

    case 'author_year':
      const authorYears = Array.from(new Set(books.flatMap(book => [book.authors[0].birth_year, book.authors[0].death_year])));
      return books.filter(book =>
        (book.authors[0].birth_year <= filterValue && filterValue <= book.authors[0].death_year)
      );

    default:
      console.error('Invalid filter type.');
      return books;
  }
}

const GutenbergSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [sortedResults, setSortedResults] = useState([]);
  const [sortOrder, setSortOrder] = useState('descending_popular');
  const [filterType, setFilterType] = useState('');
  const [filterValue, setFilterValue] = useState('');
  const [selectedSearchType, setSelectedSearchType] = useState('default');
  const [isAuthorYearFilter, setIsAuthorYearFilter] = useState(false);
  const [nextPageUrl, setNextPageUrl] = useState(null);
  const [prevPageUrl, setPrevPageUrl] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (results.length > 0) {
          const sorted = await sortBooks(results, sortOrder);
          setSortedResults(sorted);
        }
      } catch (error) {
        console.error('Error sorting books:', error);
      }
    };

    fetchData();
  }, [sortOrder, results]);

  useEffect(() => {
    const filtered = filterBooks(sortedResults, filterType, filterValue);
    setFilteredResults(filtered);
  }, [sortedResults, filterType, filterValue]);

  const handleNextPage = () => {
    if (nextPageUrl) {
      if (searchTerm !== '') {
        handleSearch(currentPage + 1);
      } else {
        handleShowAllBooks(currentPage + 1);
      }
    }
  };

  const handlePreviousPage = () => {
    if (prevPageUrl) {
      if (searchTerm !== '') {
        handleSearch(currentPage - 1);
      } else {
        handleShowAllBooks(currentPage - 1);
      }
    }
  };

  const handleSearch = async (page = 1) => {
    try {
      const data = await searchBooks(searchTerm, selectedSearchType, sortOrder, page);
      setResults(data.results);
      setFilteredResults(data.results);
      setSortedResults(data.results);
      setNextPageUrl(data.next);
      setPrevPageUrl(data.previous);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error in search:', error);
    }
  };

  const handleShowAllBooks = async (page = 1) => {
    try {
      const data = await getBookList(sortOrder, page);
      setResults(data.results);
      setFilteredResults(data.results);
      setSortedResults(data.results);
      setNextPageUrl(data.next);
      setPrevPageUrl(data.previous);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error getting all books:', error);
    }
  };

  const handleApplyAuthorYearFilter = () => {
    setIsAuthorYearFilter(!isAuthorYearFilter);
  };

  return (
    <div>
      <form>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by title, author, topic, etc."
        />

        <select value={selectedSearchType} onChange={(e) => setSelectedSearchType(e.target.value)}>
          <option value="default">Default</option>
          <option value="topic">Topic</option>
        </select>

        <button type="button" onClick={() => handleSearch()}>Search</button>

        {/* Language Filter */}
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          <option value="">Select Filter Type</option>
          <option value="language">Language</option>
          <option value="author_year">Author Year</option>
        </select>

        {/* Language Dropdown (if Language Filter is selected) */}
        {filterType === 'language' && (
          <select onChange={(e) => setFilterValue(e.target.value)}>
            <option value="">Select Language</option>
            {/* Map languages from the books to dropdown options */}
            {Array.from(new Set(results.flatMap(book => book.languages))).map(language => (
              <option key={language} value={language}>{language}</option>
            ))}
          </select>
        )}

        {/* Author Year Filter */}
        {filterType === 'author_year' && (
          <div>
            <label>Author Year: </label>
            <input
              type="number"
              value={filterValue}
              onChange={(e) => {
                setFilterValue(e.target.value);
                // Toggle the state on each input change
                setIsAuthorYearFilter(!isAuthorYearFilter);
              }}
              placeholder="Enter Year"
            />
          </div>
        )}

        <button type="button" onClick={() => setSortOrder('ascending_popular')}>Sort ascending</button>
        <button type="button" onClick={() => setSortOrder('descending_popular')}>Sort descending</button>
        <button type="button" onClick={() => setSortOrder('alphabetical')}>Sort alphabetical</button>
        <button type="button" onClick={() => setSortOrder('reverse_alphabetical')}>Sort reverse alphabetical</button>

        <button type="button" onClick={() => handleShowAllBooks()}>Show All Books</button>
      </form>

      <ul>
        {isAuthorYearFilter
          ? filteredResults.map((book) => (
              <li key={book.id}>
                <p>Title: {book.title}</p>
                <p>Author: {book.authors.map(author => author.name).join(', ')}</p>
              </li>
            ))
          : sortedResults.map((book) => (
              <li key={book.id}>
                <p>Title: {book.title}</p>
                <p>Author: {book.authors.map(author => author.name).join(', ')}</p>
              </li>
            ))}
      </ul>

      {/* Pagination Footer */}
      <div>
        <button
          type="button"
          onClick={handlePreviousPage}
          disabled={!prevPageUrl}
        >
          Previous
        </button>
        <span> Page {currentPage} </span>
        <button
          type="button"
          onClick={handleNextPage}
          disabled={!nextPageUrl}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default GutenbergSearch;

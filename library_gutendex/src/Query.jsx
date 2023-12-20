import React, { useState, useEffect } from 'react';
import './GutenbergSearch.css'; 

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
      return books.filter((book) => book.languages.includes(filterValue));

    case 'author_year':
      return books.filter((book) => {
        const authors = book.authors || []; // Handle null or undefined authors
        const birthYears = authors
          .map((author) => author.birth_year)
          .filter((year) => year !== null);
        const deathYears = authors
          .map((author) => author.death_year)
          .filter((year) => year !== null);

        const minBirthYear = Math.min(...birthYears);
        const maxDeathYear = Math.max(...deathYears);

        return (
          minBirthYear !== undefined &&
          maxDeathYear !== undefined &&
          minBirthYear <= filterValue &&
          filterValue <= maxDeathYear
        );
      });

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
  const [sortOrder, setSortOrder] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterValue, setFilterValue] = useState('');
  const [selectedSearchType, setSelectedSearchType] = useState('default');
  const [isAuthorYearFilter, setIsAuthorYearFilter] = useState(true);
  const [nextPageUrl, setNextPageUrl] = useState(null);
  const [prevPageUrl, setPrevPageUrl] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [searchTrigger, setSearchTrigger] = useState(false);


  useEffect(() => {
    // Fetch all books when the component mounts
    handleShowAllBooks();
  }, []);


  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        if (results.length > 0) {
          const sorted = await sortBooks(results, sortOrder);
          setSortedResults(sorted);
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Error sorting books:', error);
        setIsLoading(false);
      }
    };

    fetchData();
  }, [sortOrder, results]);

  useEffect(() => {
    const filtered = filterBooks(sortedResults, filterType, filterValue);
    setFilteredResults(filtered);

    
    if (!isLoading && filtered.length < 1 && searchTerm !== ''){
      setMessage("No results found");
    }
    else{
      setMessage('');
    }
  }, [sortedResults, filterType, filterValue, searchTerm, message]);

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
      setIsLoading(true);

      const data = await searchBooks(searchTerm, selectedSearchType, sortOrder, page);
      setResults(data.results);
      setFilteredResults(data.results);
      setSortedResults(data.results);
      setNextPageUrl(data.next);
      setPrevPageUrl(data.previous);
      setCurrentPage(page);

      setIsLoading(false);
      if (!isLoading && data.results.length < 1 && searchTerm !== ''){
        setMessage("No results found");
      }
      else{
        setMessage('');
      }
    } catch (error) {
      console.error('Error in search:', error);
      setIsLoading(false);
      setMessage('Error searching for books');
    }
  };

  const handleShowAllBooks = async (page = 1) => {
    try {
      setIsLoading(true);

      const data = await getBookList(sortOrder, page);
      setResults(data.results);
      setFilteredResults(data.results);
      setSortedResults(data.results);
      setNextPageUrl(data.next);
      setPrevPageUrl(data.previous);
      setCurrentPage(page);

      setIsLoading(false);
    } catch (error) {
      console.error('Error getting all books:', error);
      setIsLoading(false);
      setMessage('Error getting books');
    }
  };


  const handleAuthorClick = (authorName) => {
    try {
      
      setSearchTerm(authorName);
      setSearchTrigger(true);
    } catch (error) {
      console.error('Error handling author click:', error);
    }
  };
  
  const handleBookshelfClick = (bookshelf) => {
    try {
      
      setSearchTerm(bookshelf);
      setSelectedSearchType('topic');
      setSearchTrigger(true);
    } catch (error) {
      console.error('Error handling bookshelf click:', error);
    }
  };
  
  
  useEffect(() => {
    if (searchTrigger) {
      handleSearch();
      setSearchTrigger(false);
    }
  }, [searchTerm, searchTrigger]);
  return (
    <div className="gutenberg-container">
      {/* Navbar */}
      <div className="navbar-container">
                <form
            className="search-form"
            onSubmit={(e) => {
              e.preventDefault(); 
              handleSearch();
            }}
          >
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search title, author or topic"
            />

            <select
              value={selectedSearchType}
              onChange={(e) => setSelectedSearchType(e.target.value)}
            >
              <option value="default">Default</option>
              <option value="topic">Topic</option>
            </select>

            <button type="submit" className="btn41-43 btn-41">
              Search
            </button>

            <button
              type="button"
              className="btn41-43 btn-41"
              onClick={() => handleShowAllBooks()}
            >
              Get All Books
            </button>


          {/* Filters in Navbar */}
          <div className="filter-container">
            <select
              onChange={(e) => {
                setFilterType('language');
                setFilterValue(e.target.value);
              }}
              value={filterValue}
            >
              <option value="">Select Language</option>
              {Array.from(new Set(results.flatMap((book) => book.languages))).map((language) => (
                <option key={language} value={language}>
                  {language}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-container">
            <input
              type="number"
              value={filterValue}
              onChange={(e) => {
                setFilterType('author_year');
                setFilterValue(e.target.value);
              }}
              placeholder="See if author was alive that year"
            />
          </div>
          <div className="filter-container ">
            <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
              <option value="">Sort by</option>
              <option value="ascending_popular">Sort by Least Popular</option>
              <option value="descending_popular">Sort by Most Popular</option>
              <option value="alphabetical">Sort A-Z</option>
              <option value="reverse_alphabetical">Sort Z-A</option>
            </select>
          </div>
        </form>

        <a href="https://gutendex.com" className="gutendex-link">
          Gutendex
        </a>
      </div>

      {/* Results */}
      <div className="results-container">
        {/* Show loading message */}
        {isLoading && <p>Loading... Waiting for Gutendex API</p>}

        {!isLoading && message && <p>{message}</p>}
       

        <ul>
          {isAuthorYearFilter
            ? filteredResults.map((book) => (
                <li key={book.id} className="hover-effect" >
                   <div className="background-image" style={{ backgroundImage: `url(${book.formats['image/jpeg']})` }}></div>
                  <div className="book-container"  >
                    <div className="info-container">
                      <div className="title-container">
                        <p className="titles">Title:</p>
                        <p>{book.title}</p>
                      </div>
                      <div className="author-container">
                        <p className="titles">Author:</p>
                        {book.authors.map((author, index) => (
                                          <React.Fragment key={author.name}>
                                            <span
                                              className="clickable-text"
                                              onClick={() => handleAuthorClick(author.name)}
                                            >
                                              {author.name}
                                            </span>
                                            {index < book.authors.length - 1 && "; "}
                                          </React.Fragment>
                                        ))}
                      </div>
                      <div className="bookshelves-container">
                        <p className="titles">Categories:</p>
                        {book.bookshelves.map((bookshelf, index) => (
                                    <React.Fragment key={bookshelf}>
                                      <span
                                        className="clickable-text"
                                        onClick={() => handleBookshelfClick(bookshelf)}
                                      >
                                        {bookshelf}
                                      </span>
                                      {index < book.bookshelves.length - 1 && "; "}
                                    </React.Fragment>
                                  ))}
                      </div>
                      <div className="language-container">
                        <p className="titles">Language:</p>
                        <p>{book.languages.join(', ')}</p>
                      </div>
                    </div>
                    <div className="book-image hover-effect">
                      <a
                        href={book.formats['text/html']}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <img src={book.formats['image/jpeg']} alt="Book Cover" />
                      </a>
                    </div>
                  </div>
                </li>
              ))
            : sortedResults.map((book) => (
                <li key={book.id} className="hover-effect">
                   <div className="background-image" style={{ backgroundImage: `url(${book.formats['image/jpeg']})` }}></div>
                  <div className="book-container">
                    <div className="info-container">
                      <div className="title-container">
                        <p className="titles">Title:</p>
                        <p>{book.title}</p>
                      </div>
                      <div className="author-container">
                        <p className="titles">Author:</p>
                        {book.authors.map((author, index) => (
                                      <React.Fragment key={author.name}>
                                        <span
                                          className="clickable-text"
                                          onClick={() => handleAuthorClick(author.name)}
                                        >
                                          {author.name}
                                        </span>
                                        {index < book.authors.length - 1 && "; "}
                                      </React.Fragment>
                                    ))}
                      </div>
                      <div className="bookshelves-container">
                        <p className="titles">Categories:</p>
                        {book.bookshelves.map((bookshelf, index) => (
                                  <React.Fragment key={bookshelf}>
                                    <span
                                      className="clickable-text"
                                      onClick={() => handleBookshelfClick(bookshelf)}
                                    >
                                      {bookshelf}
                                    </span>
                                    {index < book.bookshelves.length - 1 && "; "}
                                  </React.Fragment>
                                ))}
                      </div>
                      <div className="language-container">
                        <p className="titles">Language:</p>
                        <p>{book.languages.join(', ')}</p>
                      </div>
                    </div>
                    <div className="book-image hover-effect">
                      <a
                        href={book.formats['text/html']}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <img src={book.formats['image/jpeg']} alt="Book Cover" />
                      </a>
                    </div>
                  </div>
                </li>
              ))}
        </ul>
      </div>

      {/* Pagination Footer */}
      {nextPageUrl || prevPageUrl ? (
        <div className="pagination-container">
          <button
            type="button"
            className="btn41-43 btn-41"
            onClick={handlePreviousPage}
            disabled={!prevPageUrl}
          >
            Previous
          </button>
          <span > Page {currentPage} </span>
          <button
            type="button"
            className="btn41-43 btn-41"
            onClick={handleNextPage}
            disabled={!nextPageUrl}
          >
            Next
          </button>
        </div>
      ) : null}
    </div>
  );
};

export default GutenbergSearch;
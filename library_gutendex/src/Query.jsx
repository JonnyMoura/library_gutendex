import React, { useState, useEffect } from 'react';

const API_BASE_URL = 'https://www.gutendex.com'; 

function getBookList(sortOrder = 'popular') {
  const url = `${API_BASE_URL}/books?sort=${sortOrder}`;
  return fetch(url)
    .then(response => response.json())
    .then(data => data.results)
    .catch(error => {
      console.error('Error getting the list of books:', error);
      return [];
    });
}

function searchBooks(query, searchType, sortOrder = 'popular') {
  const validSearchTypes = ['title', 'topic', 'release_date', 'author'];
  if (!validSearchTypes.includes(searchType)) {
    console.error('Invalid search type.');
    return Promise.reject('Invalid search type.');
  }

  const url = `${API_BASE_URL}/books?search=${encodeURIComponent(query)}&sort=${sortOrder}`;
  return fetch(url)
    .then(response => response.json())
    .then(data => data.results)
    .catch(error => {
      console.error('Error searching for books:', error);
      return [];
    });
}

function sortBooks(books, sortType) {
  if (!sortType) {
    return books;
  }

  return [...books].sort((a, b) => {
    switch (sortType) {
      case 'alphabetical':
        return a.title.localeCompare(b.title);
      case 'reverse_alphabetical':
        return b.title.localeCompare(a.title);
      case 'chronological':
        return new Date(a.release_date) - new Date(b.release_date);
      case 'popularity':
        return b.download_count - a.download_count;
      default:
        console.error('Invalid sort type.');
        return 0;
    }
  });
}

function filterBooks(books, filterType, filterValue) {
  if (!filterType || !filterValue) {
    return books;
  }

  switch (filterType) {
    case 'language':
      return books.filter(book => book.languages.includes(filterValue));
    case 'topic':
      return books.filter(book => book.subjects.includes(filterValue));
    default:
      console.error('Invalid filter type.');
      return books;
  }
}

const GutenbergSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [sortOrder, setSortOrder] = useState('popular');
  const [filterType, setFilterType] = useState('');
  const [filterValue, setFilterValue] = useState('');
  const [selectedSearchType, setSelectedSearchType] = useState('title');

  useEffect(() => {
    getBookList(sortOrder).then(data => setResults(data));
  }, [sortOrder]);

  useEffect(() => {
    const filtered = filterBooks(results, filterType, filterValue);
    const sorted = sortBooks(filtered, sortOrder);
    setFilteredResults(sorted);
  }, [results, filterType, filterValue, sortOrder]);

  const handleSearch = () => {
    searchBooks(searchTerm, selectedSearchType, sortOrder)
      .then(data => setResults(data))
      .catch(error => console.error('Error in search:', error));
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
          <option value="title">Title</option>
          <option value="topic">Topic</option>
          <option value="release_date">Release Date</option>
          <option value="author">Author</option>
        </select>

        <button type="button" onClick={handleSearch}>Search</button>

        <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          <option value="">Select Filter Type</option>
          <option value="language">Language</option>
          <option value="topic">Topic</option>
        </select>

        <input
          type="text"
          value={filterValue}
          onChange={(e) => setFilterValue(e.target.value)}
          placeholder="Filter Value"
        />

        <button type="button" onClick={() => setSortOrder('alphabetical')}>Sort Alphabetically</button>
        <button type="button" onClick={() => setSortOrder('reverse_alphabetical')}>Sort Reverse Alphabetically</button>
        <button type="button" onClick={() => setSortOrder('chronological')}>Sort Chronologically</button>
        <button type="button" onClick={() => setSortOrder('popularity')}>Sort by Popularity</button>
      </form>

      <ul>
        {filteredResults.map((book) => (
          <li key={book.id}>
            <p>{book.title}</p>
            <p>{book.author_name}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default GutenbergSearch;
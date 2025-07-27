const filmNameForm = document.getElementById('film-name-form');
const filmNameResults = document.getElementById('film-name-results');

filmNameForm.addEventListener('submit', async function(e) {
  e.preventDefault();
  const filmName = document.getElementById('film-name-input').value.trim();
  if (!filmName) return;
  filmNameResults.innerHTML = '<div style="color:#fff;">Searching...</div>';
  try {
    const res = await fetch(`https://gj02gkjp69.execute-api.eu-west-1.amazonaws.com/stuff/film-search?film-name=${encodeURIComponent(filmName)}`);
    if (!res.ok) throw new Error('Network response was not ok');
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      filmNameResults.innerHTML = '<ul style="list-style:none;padding:0;">' +
        data.map(movie => {
          const date = new Date(movie.release_date);
          const formatted = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
          return `
            <li style="display:flex;align-items:center;gap:1rem;margin-bottom:1rem;cursor:pointer;background:#23272a;border-radius:0.7rem;padding:0.7rem 1rem;transition:background 0.2s;" class="film-search-result" data-id="${movie.id}">
              <img src="https://image.tmdb.org/t/p/w92/${movie.poster_path}" alt="Poster" style="border-radius:0.4rem;width:48px;height:72px;object-fit:cover;background:#222;">
              <div>
                <div style="font-size:1.1rem;color:#7ed6df;font-weight:600;">${movie.title}</div>
                <div style="font-size:0.98rem;color:#dcdde1;">${formatted}</div>
              </div>
            </li>
          `;
        }).join('') + '</ul>';
      // Add click listeners
      Array.from(document.getElementsByClassName('film-search-result')).forEach(el => {
        el.addEventListener('click', function() {
          const id = this.getAttribute('data-id');
          fetchDegreesOfSeparation(id);
          filmNameResults.innerHTML = '';
        });
      });
    } else {
      filmNameResults.innerHTML = '<div style="color:#fff;">No results found.</div>';
    }
  } catch (err) {
    filmNameResults.innerHTML = `<div style="color:#ff6b6b;">Error: ${err.message}</div>`;
  }
});

function getDecadeCheckboxValue() {
  return document.getElementById('decade-checkbox')?.checked;
}

async function fetchDegreesOfSeparation(filmId) {
  const grid = document.getElementById('results-grid');
  const originalFilm = document.getElementById('original-film');
  originalFilm.innerHTML = '';
  grid.innerHTML = '<div style="color:#fff;">Loading...</div>';
  const decade = getDecadeCheckboxValue();
  let url = `https://gj02gkjp69.execute-api.eu-west-1.amazonaws.com/stuff/degrees-of-separation?film-id=${encodeURIComponent(filmId)}&by-decade=${decade ? 'true' : 'false'}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Network response was not ok');
    const data = await res.json();
    const date = new Date(data.original_film.release_date);
    const formattedDate = date.toLocaleDateString('en-GB', { year: 'numeric' });
    originalFilm.innerHTML = `Connections to: <a href="https://letterboxd.com/tmdb/${data.original_film.id}" target="_blank" rel="noopener" style="color:inherit;text-decoration:underline;">${data.original_film.title} (${formattedDate})</a>`;
    grid.innerHTML = '';
    if (Array.isArray(data.options) && data.options.length > 0) {
      // Sort by rating_of_10, highest first
      data.options.sort((a, b) => (b.rating_of_10 || 0) - (a.rating_of_10 || 0));
      data.options.forEach(movie => {
        grid.innerHTML += `
          <div class="glass-card">
            <img class="poster-thumb" src="${window.innerWidth <= 700 ? `https://image.tmdb.org/t/p/w92/${movie.poster_path}` : `https://image.tmdb.org/t/p/w154/${movie.poster_path}` }" alt="Movie Poster">
            <div class="card-content">
              <h2 class="movie-title">
                <a href="https://letterboxd.com/tmdb/${movie.id}" target="_blank" rel="noopener" style="color:inherit;text-decoration:underline;">
                  ${movie.title || 'No Title'}
                </a>
              </h2>
              <p class="release-date">${movie.release_date ? new Date(movie.release_date).toLocaleDateString('en-GB', { year: 'numeric' }) : 'Unknown Release Date'}</p>
              <div class="star-rating" title="${typeof movie.rating_of_10 === 'number' ? movie.rating_of_10.toFixed(1) + ' / 10' : 'No rating'}">
                ${typeof movie.rating_of_10 === 'number' ? renderStars(movie.rating_of_10) : '<span style="color:#636e72;">No rating</span>'}
              </div>
              <a href="${movie.link}" target="_blank" rel="noopener" class="tmdb-link">View on TMDB</a>
              <ul class="actor-list">
                ${(movie.shared_actors || []).map(actor => `<li>${actor}</li>`).join('')}
              </ul>
            </div>
          </div>
        `;
      });
    } else {
      grid.innerHTML = '<div style="color:#fff;">No results found.</div>';
    }
  } catch (err) {
    grid.innerHTML = `<div style="color:#ff6b6b;">Error: ${err.message}</div>`;
  }
}

// Film ID form submit
const filmForm = document.getElementById('film-form');
filmForm.addEventListener('submit', function(e) {
  e.preventDefault();
  const filmId = document.getElementById('film-id-input').value.trim();
  if (!filmId) return;
  fetchDegreesOfSeparation(filmId);
});

function renderStars(rating) {
  const fullStars = Math.floor(rating / 2);
  const halfStar = rating % 2 >= 1 ? 1 : 0;
  const emptyStars = 5 - fullStars - halfStar;
  let stars = '';
  for (let i = 0; i < fullStars; i++) stars += '<span class="star">★</span>';
  if (halfStar) stars += '<span class="star">☆</span>';
  for (let i = 0; i < emptyStars; i++) stars += '<span class="star empty">★</span>';
  stars += `<span class="star-numeric">${rating.toFixed(1)} / 10</span>`;
  return stars;
}


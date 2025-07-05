document.getElementById('film-form').addEventListener('submit', async function(e) {
  e.preventDefault();
  const filmId = document.getElementById('film-id-input').value.trim();
  if (!filmId) return;

  const grid = document.getElementById('results-grid');
  grid.innerHTML = '<div style="color:#fff;">Loading...</div>';

  try {
    const res = await fetch(`https://gj02gkjp69.execute-api.eu-west-1.amazonaws.com/stuff/degrees-of-separation?film-id=${encodeURIComponent(filmId)}`);
    if (!res.ok) throw new Error('Network response was not ok');
    const data = await res.json();
    // Example: data = { title: 'Movie Title', poster: 'url', actors: ['A', 'B', 'C'] }
    grid.innerHTML = '';
    if (Array.isArray(data) && data.length > 0) {
      data.forEach(movie => {
        grid.innerHTML += `
          <div class="glass-card">
            <img class="poster-thumb" src="${window.innerWidth <= 700 ? `https://image.tmdb.org/t/p/w92/${movie.poster_path}` : `https://image.tmdb.org/t/p/w154/${movie.poster_path}`}" alt="Movie Poster">
            <div class="card-content">
              <h2 class="movie-title">
                <a href="https://letterboxd.com/tmdb/${movie.id}" target="_blank" rel="noopener" style="color:inherit;text-decoration:underline;">
                  ${movie.title || 'No Title'}
                </a>
              </h2>
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
});

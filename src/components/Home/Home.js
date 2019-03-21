import React, { Component } from 'react';
import { API_URL, API_KEY, IMAGE_BASE_URL, POSTER_SIZE, BACKDROP_SIZE } from '../../config';
import HeroImage from '../elements/HeroImage/HeroImage';
import SearchBar from '../elements/SearchBar/SearchBar';
import FourColGrid from '../elements/FourColGrid/FourColGrid';
import MovieThumb from '../elements/MovieThumb/MovieThumb';
import LoadMoreBtn from '../elements/LoadMoreBtn/LoadMoreBtn';
import Spinner from '../elements/Spinner/Spinner';
import './Home.css';

class Home extends Component {
  state = {
    movies: [],
    heroImage: null,
    loading: false,
    currentPage: 0,
    totalPages: 0,
    searchTerm: '',
  }

  componentDidMount() {
    if (sessionStorage.getItem('HomeState')) {
      let state = JSON.parse(sessionStorage.getItem('HomeState'))
      this.setState({ ...state })
    } else {
      this.setState({ loading: true })
      this.fetchItems(this.popularEP(false)(""));
    }
  }

  curriedEndpoint = type => loadMore => searchTerm =>
    `${API_URL}${type}?api_key=${API_KEY}&language=en-US&page=${loadMore
      && this.state.currentPage + 1}&query=${searchTerm}`;

  searchEP = this.curriedEndpoint("search/movie");
  popularEP = this.curriedEndpoint("movie/popular");

  updateItems = (loadMore, searchTerm) => {
    this.setState(
      {
        movies: loadMore ? [...this.state.movies] : [],
        loading: true,
        searchTerm: loadMore ? this.state.searchTerm : searchTerm,
      },
      () => {
        this.fetchItems(
          !this.state.searchTerm
          ? this.popularEP(loadMore)("")
          : this.searchEP(loadMore)(this.state.searchTerm)
        )
      }
    )
  }

  fetchItems = (endpoint) => {
    // ES6 Destructuring the state
    const { movies, heroImage, searchTerm } = this.state;

    fetch(endpoint)
    .then(result => result.json())
    .then(result => {
      this.setState({
        movies: [...movies, ...result.results],
        heroImage: heroImage || result.results[0],
        loading: false,
        currentPage: result.page,
        totalPages: result.total_pages
      }, () => {
        // Remember state for the next mount if we´re not in a search view
        if (searchTerm === "") {
          sessionStorage.setItem('HomeState', JSON.stringify(this.state));
        }
      })
    })
    .catch(error => console.error('Error:', error))
  }

  render() {
    // ES6 Destructuring the state
    const { movies, heroImage, loading, currentPage, totalPages, searchTerm } = this.state;

    return (
      <div className="rmdb-home">
        {heroImage && !searchTerm ?
          <div>
            <HeroImage
              image={`${IMAGE_BASE_URL}${BACKDROP_SIZE}${heroImage.backdrop_path}`}
              title={heroImage.original_title}
              text={heroImage.overview}
            />
          </div> : null }
            <SearchBar callback={this.updateItems}/>
          <div className="rmdb-home-grid">
            <FourColGrid
              header={searchTerm ? 'Search Result' : 'Popular Movies'}
              loading={loading}
            >
              {movies.map( (element, i) => (
                <MovieThumb
                  key={i}
                  clickable={true}
                  image={element.poster_path ? `${IMAGE_BASE_URL}${POSTER_SIZE}${element.poster_path}` : './images/no_image.jpg'}
                  movieId={element.id}
                  movieName={element.original_title}
                />
              ))}
            </FourColGrid>
            {loading ? <Spinner /> : null}
            {(currentPage < totalPages && !loading) ?
              <LoadMoreBtn text="Load More" onClick={this.updateItems} />
              : null
            }
          </div>
      </div>
    )
  }
}

export default Home;
import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';
import { Notify } from 'notiflix/build/notiflix-notify-aio';
import { Loading } from 'notiflix/build/notiflix-loading-aio';
import OnlyScroll from 'only-scrollbar';

import { fetchImage } from './fetch_api.js';

const ref = {
  gallery: document.querySelector('.gallery'),
  searchForm: document.querySelector('.search-form'),
  btnLoadmore: document.querySelector('.load-more'),
};
const paramFetch = {
  searchItem: '',
  page: 1,
  perPage: 15,
};

ref.btnLoadmore.addEventListener('click', onClickLoadmore);
ref.searchForm.addEventListener('submit', onSearchClickBtn);

const $lightbox = new SimpleLightbox('.gallery a', {
  captions: true,
  captionsData: 'alt',
  captionDelay: 250,
});

function onSearchClickBtn(e) {
  e.preventDefault();

  resetParamNewSearch();

  paramFetch.searchItem = e.target.searchQuery.value;
  if (!paramFetch.searchItem) {
    Notify.warning('Search bar is empty.');
    return;
  }

  markupFetchSearchItem(paramFetch);

  ref.searchForm.reset();
}

function markupFetchSearchItem() {
  Loading.dots();
  fetchImage(({ page, perPage, searchItem } = paramFetch))
    .then(res => {
      const countFoudItem =
        res.hits.length === 0 ? res.hits.length : res.totalHits;
      if (countFoudItem) {
        Notify.success(`Hooray! We found ${countFoudItem} images.`);
        updatePage(res);
        paramFetch.page += 1;
      } else {
        Notify.info('Nothing was found according to your request.');
      }
    })
    .catch(error => {
      Notify.failure('Unable to load results. ' + error.message);
    })
    .finally(() => {
      Loading.remove(250);
    });
}

function onClickLoadmore() {
  Loading.dots();
  fetchImage(({ page, perPage, searchItem } = paramFetch))
    .then(res => {
      const countFoudItem =
        res.hits.length === 0 ? res.hits.length : res.totalHits;
      const countPage = Math.ceil(countFoudItem / perPage);
      updatePage(res);
      paramFetch.page += 1;
      if (countPage >= page) {
        ref.btnLoadmore.classList.add('is-hidden');
        Notify.info(
          "We're sorry, but you've reached the end of search results."
        );
      }
    })
    .catch(error => {
      Notify.failure('Unable to load results.');
    })
    .finally(() => {
      Loading.remove(350);
    });
}

function markupImg(data) {
  return data
    .map(
      ({
        webformatURL,
        largeImageURL,
        tags,
        likes,
        views,
        comments,
        downloads,
      }) =>
        `<li class="photo-card">
            <a href="${largeImageURL}">        
                <img src="${webformatURL}" alt="${tags}" loading="lazy" width = "100%" />
            </a>
            <div class="info">
                <p class="info-item">
                <b>Likes</b>
                ${likes}
                </p>
                <p class="info-item">
                <b>Views</b>
                ${views}
                </p>
                <p class="info-item">
                <b>Comments</b>
                ${comments}
                </p>
                <p class="info-item">
                <b>Downloads</b>
                ${downloads}
                </p>
            </div>             
        </li>`
    )
    .join('');
}

function updatePage(res) {
  ref.gallery.insertAdjacentHTML('beforeend', markupImg(res.hits));
  ref.btnLoadmore.classList.remove('is-hidden');
  $lightbox.refresh();
}

function resetParamNewSearch() {
  ref.gallery.innerHTML = '';
  paramFetch.page = 1;
  ref.btnLoadmore.classList.add('is-hidden');
}

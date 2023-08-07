import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';
import { Notify } from 'notiflix/build/notiflix-notify-aio';
import { Loading } from 'notiflix/build/notiflix-loading-aio';
import 'bootstrap/dist/css/bootstrap.min.css';
var throttle = require('lodash.throttle');

import { fetchImage } from './fetch_api.js';

const ref = {
  gallery: document.querySelector('.gallery'),
  searchForm: document.querySelector('.search-form'),
  btnLoadmore: document.querySelector('.load-more'),
  radioBtn: document.querySelector('#flexSwitchCheckDefault'),
  scrollbar: document.querySelector('.scrollbar'),
};
const paramFetch = {
  searchItem: '',
  page: 1,
  perPage: 15,
};
const windowHeight = document.documentElement.clientHeight;
let loadStatus = true;
let memScrollY = window.pageYOffset;

ref.btnLoadmore.addEventListener('click', onClickLoadmore);
ref.searchForm.addEventListener('submit', onSearchClickBtn);
window.addEventListener('scroll', throttle(onScrollLoadMore, 300));

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

  e.target.searchQuery.value = '';
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
      loadStatus = false;
    });
}

function onClickLoadmore() {
  Loading.dots();
  console.log(paramFetch.page);
  fetchImage(({ page, perPage, searchItem } = paramFetch))
    .then(res => {
      const countFoudItem =
        res.hits.length === 0 ? res.hits.length : res.totalHits;
      const countPage = Math.ceil(countFoudItem / perPage);
      updatePage(res);

      scrollWindow();

      if (countPage < paramFetch.page) {
        ref.btnLoadmore.classList.add('is-hidden');
        Notify.info(
          "We're sorry, but you've reached the end of search results."
        );
      }
      paramFetch.page += 1;
    })
    .catch(error => {
      Notify.failure('Unable to load results.');
    })
    .finally(() => {
      Loading.remove(350);
      loadStatus = false;
    });
}

function scrollWindow() {
  const { height: cardHeight } =
    ref.gallery.firstElementChild.getBoundingClientRect();
  window.scrollBy({
    top: cardHeight * 5,
    behavior: 'smooth',
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
  $lightbox.refresh();
  if (!ref.radioBtn.checked) {
    ref.btnLoadmore.classList.remove('is-hidden');
  }
}

function resetParamNewSearch() {
  ref.gallery.innerHTML = '';
  paramFetch.page = 1;
  memScrollY = window.pageYOffset;
  ref.scrollbar.style.width = `0vw`;
  ref.btnLoadmore.classList.add('is-hidden');
}

function onScrollLoadMore() {
  const btnHeigth = !ref.radioBtn.checked ? 115 : 0;
  const galleryPos = ref.gallery.getBoundingClientRect().top + pageYOffset;
  const galleryPosHeigth = ref.gallery.offsetHeight;
  const currentScrollY = window.pageYOffset;
  const statusBar =
    (currentScrollY / (galleryPosHeigth - windowHeight + btnHeigth)) * 100;

  ref.scrollbar.style.width = `${statusBar}vw`;

  if (!ref.radioBtn.checked) {
    return;
  }

  if (
    pageYOffset > galleryPos + galleryPosHeigth - windowHeight &&
    loadStatus === false &&
    memScrollY < currentScrollY
  ) {
    memScrollY = window.pageYOffset;
    loadStatus = true;
    onClickLoadmore();
  }
}

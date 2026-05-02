import { createCardElement } from "./components/card.js";
import {
  openModalWindow,
  closeModalWindow,
  setCloseModalWindowEventListeners,
} from "./components/modal.js";
import { enableValidation, clearValidation } from "./components/validation.js";
import {
  getUserInfo,
  getCardList,
  setUserInfo,
  setUserAvatar,
  addCard,
  deleteCard as deleteCardApi,
  changeLikeCardStatus,
} from "./components/api.js";

const validationSettings = {
  formSelector: ".popup__form",
  inputSelector: ".popup__input",
  submitButtonSelector: ".popup__button",
  inactiveButtonClass: "popup__button_disabled",
  inputErrorClass: "popup__input_type_error",
  errorClass: "popup__error_visible",
};
enableValidation(validationSettings);

const placesWrap = document.querySelector(".places__list");
const profileFormModalWindow = document.querySelector(".popup_type_edit");
const profileForm = profileFormModalWindow.querySelector(".popup__form");
const profileTitleInput = profileForm.querySelector(".popup__input_type_name");
const profileDescriptionInput = profileForm.querySelector(".popup__input_type_description");
const profileTitle = document.querySelector(".profile__title");
const profileDescription = document.querySelector(".profile__description");
const profileAvatar = document.querySelector(".profile__image");

const cardFormModalWindow = document.querySelector(".popup_type_new-card");
const cardForm = cardFormModalWindow.querySelector(".popup__form");
const cardNameInput = cardForm.querySelector(".popup__input_type_card-name");
const cardLinkInput = cardForm.querySelector(".popup__input_type_url");

const avatarFormModalWindow = document.querySelector(".popup_type_edit-avatar");
const avatarForm = avatarFormModalWindow.querySelector(".popup__form");
const avatarInput = avatarForm.querySelector(".popup__input");

const imageModalWindow = document.querySelector(".popup_type_image");
const imageElement = imageModalWindow.querySelector(".popup__image");
const imageCaption = imageModalWindow.querySelector(".popup__caption");

const removeCardModalWindow = document.querySelector(".popup_type_remove-card");
const removeCardForm = removeCardModalWindow.querySelector(".popup__form");
const removeCardButton = removeCardForm.querySelector(".popup__button");

const statsModalWindow = document.querySelector(".popup_type_info");

const openProfileFormButton = document.querySelector(".profile__edit-button");
const openCardFormButton = document.querySelector(".profile__add-button");
const logo = document.querySelector(".header__logo");

let currentUserId = null;
let currentCardId = null;
let currentCardElement = null;

const setButtonLoading = (button, isLoading, defaultText, loadingText = "Сохранение...") => {
  if (isLoading) {
    button.textContent = loadingText;
    button.disabled = true;
  } else {
    button.textContent = defaultText;
    button.disabled = false;
  }
};

const handlePreviewPicture = ({ name, link }) => {
  imageElement.src = link;
  imageElement.alt = name;
  imageCaption.textContent = name;
  openModalWindow(imageModalWindow);
};

const handleLike = (cardId, likeButton, likeCountElement) => {
  const isLiked = likeButton.classList.contains("card__like-button_is-active");
  changeLikeCardStatus(cardId, isLiked)
    .then((updatedCard) => {
      likeButton.classList.toggle("card__like-button_is-active");
      likeCountElement.textContent = updatedCard.likes.length;
    })
    .catch((err) => console.error("Ошибка при изменении лайка:", err));
};

const handleDeleteClick = (cardId, cardElement) => {
  currentCardId = cardId;
  currentCardElement = cardElement;
  openModalWindow(removeCardModalWindow);
};

removeCardForm.addEventListener("submit", (evt) => {
  evt.preventDefault();
  const defaultText = removeCardButton.textContent;
  setButtonLoading(removeCardButton, true, defaultText, "Удаление...");
  deleteCardApi(currentCardId)
    .then(() => {
      currentCardElement.remove();
      closeModalWindow(removeCardModalWindow);
    })
    .catch((err) => console.error("Ошибка при удалении карточки:", err))
    .finally(() => {
      setButtonLoading(removeCardButton, false, defaultText);
    });
});

const handleProfileFormSubmit = (evt) => {
  evt.preventDefault();
  const submitButton = profileForm.querySelector(validationSettings.submitButtonSelector);
  setButtonLoading(submitButton, true, "Сохранить");
  setUserInfo({
    name: profileTitleInput.value,
    about: profileDescriptionInput.value,
  })
    .then((userData) => {
      profileTitle.textContent = userData.name;
      profileDescription.textContent = userData.about;
      closeModalWindow(profileFormModalWindow);
    })
    .catch((err) => console.error("Ошибка при обновлении профиля:", err))
    .finally(() => {
      setButtonLoading(submitButton, false, "Сохранить");
    });
};

const handleAvatarFormSubmit = (evt) => {
  evt.preventDefault();
  const submitButton = avatarForm.querySelector(validationSettings.submitButtonSelector);
  setButtonLoading(submitButton, true, "Сохранить");
  setUserAvatar(avatarInput.value)
    .then((userData) => {
      profileAvatar.style.backgroundImage = `url(${userData.avatar})`;
      closeModalWindow(avatarFormModalWindow);
    })
    .catch((err) => console.error("Ошибка при обновлении аватара:", err))
    .finally(() => {
      setButtonLoading(submitButton, false, "Сохранить");
    });
};

const handleCardFormSubmit = (evt) => {
  evt.preventDefault();
  const submitButton = cardForm.querySelector(validationSettings.submitButtonSelector);
  setButtonLoading(submitButton, true, "Создать", "Создание...");
  addCard({ name: cardNameInput.value, link: cardLinkInput.value })
    .then((newCard) => {
      const cardElement = createCardElement(newCard, {
        userId: currentUserId,
        onPreviewPicture: handlePreviewPicture,
        onLike: handleLike,
        onDelete: handleDeleteClick,
      });
      placesWrap.prepend(cardElement);
      closeModalWindow(cardFormModalWindow);
      cardForm.reset();
      clearValidation(cardForm, validationSettings);
    })
    .catch((err) => console.error("Ошибка при добавлении карточки:", err))
    .finally(() => {
      setButtonLoading(submitButton, false, "Создать");
    });
};

openProfileFormButton.addEventListener("click", () => {
  profileTitleInput.value = profileTitle.textContent;
  profileDescriptionInput.value = profileDescription.textContent;
  clearValidation(profileForm, validationSettings);
  openModalWindow(profileFormModalWindow);
});

profileAvatar.addEventListener("click", () => {
  avatarForm.reset();
  clearValidation(avatarForm, validationSettings);
  openModalWindow(avatarFormModalWindow);
});

openCardFormButton.addEventListener("click", () => {
  cardForm.reset();
  clearValidation(cardForm, validationSettings);
  openModalWindow(cardFormModalWindow);
});

const fillStatsPopup = (cards) => {
  const statsInfo = statsModalWindow.querySelector(".popup__info");
  const statsText = statsModalWindow.querySelector(".popup__text");
  const statsList = statsModalWindow.querySelector(".popup__list");
  const defTemplate = document.getElementById("popup-info-definition-template");

  statsInfo.innerHTML = "";
  statsList.innerHTML = "";

  const usersSet = new Set();
  let totalLikes = 0;
  const likesPerUser = new Map();
  const userMap = new Map();

  cards.forEach((card) => {
    totalLikes += card.likes.length;
    card.likes.forEach((like) => {
      usersSet.add(like._id);
      likesPerUser.set(like._id, (likesPerUser.get(like._id) || 0) + 1);
      if (!userMap.has(like._id)) {
        userMap.set(like._id, {
          name: like.name,
          avatar: like.avatar,
        });
      }
    });
  });

  const cardLikes = cards.map((card) => ({
    name: card.name,
    likesCount: card.likes.length,
  }));
  cardLikes.sort((a, b) => b.likesCount - a.likesCount);
  const popularCards = cardLikes.slice(0, 3);

  const totalUsers = usersSet.size;
  let maxLikes = 0;
  let championId = null;
  for (let [userId, count] of likesPerUser.entries()) {
    if (count > maxLikes) {
      maxLikes = count;
      championId = userId;
    }
  }
  let championName = championId && userMap.has(championId) ? userMap.get(championId).name : "Неизвестно";

  const statsItems = [
    { term: "Всего пользователей:", description: totalUsers },
    { term: "Всего лайков:", description: totalLikes },
    { term: "Максимально лайков от одного:", description: maxLikes },
    { term: "Чемпион лайков:", description: championName },
  ];

  statsItems.forEach((item) => {
    const clone = defTemplate.content.cloneNode(true);
    clone.querySelector(".popup__info-term").textContent = item.term;
    clone.querySelector(".popup__info-description").textContent = item.description;
    statsInfo.appendChild(clone);
  });

  statsText.textContent = "Популярные карточки:";
  popularCards.forEach((card) => {
    const li = document.createElement("li");
    li.textContent = card.name;
    statsList.appendChild(li);
  });
  
};

const showStatsPopup = () => {
  getCardList()
    .then((cards) => {
      fillStatsPopup(cards);
      openModalWindow(statsModalWindow);
    })
    .catch((err) => console.error("Ошибка при загрузке статистики:", err));
};

logo.addEventListener("click", showStatsPopup);

Promise.all([getCardList(), getUserInfo()])
  .then(([cards, userData]) => {
    currentUserId = userData._id;
    profileTitle.textContent = userData.name;
    profileDescription.textContent = userData.about;
    profileAvatar.style.backgroundImage = `url(${userData.avatar})`;

    cards.forEach((card) => {
      const cardElement = createCardElement(card, {
        userId: currentUserId,
        onPreviewPicture: handlePreviewPicture,
        onLike: handleLike,
        onDelete: handleDeleteClick,
      });
      placesWrap.append(cardElement);
    });
  })
  .catch((err) => console.error("Ошибка при начальной загрузке:", err));

const allPopups = document.querySelectorAll(".popup");
allPopups.forEach((popup) => {
  setCloseModalWindowEventListeners(popup);
});

profileForm.addEventListener("submit", handleProfileFormSubmit);
avatarForm.addEventListener("submit", handleAvatarFormSubmit);
cardForm.addEventListener("submit", handleCardFormSubmit);
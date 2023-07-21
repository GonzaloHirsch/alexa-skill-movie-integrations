const constants = require('./constants');

const prepareList = (list) => {
  let s = '';
  for (let i = 0; i < list.length; i++) {
    if (i < list.length - 2) s += `${list[i]}, `;
    else if (i < list.length - 1) s += `${list[i]}`;
    else {
      // eslint-disable-next-line prettier/prettier
      const hasComma = list.length > 2 ? ', ' : ' ';
      s += `${list.length > 1 ? `${hasComma}and ` : ''}${list[i]}`;
    }
  }
  return s;
};

const prepareMovieList = (action, movie, list) => {
  let method;
  switch (action) {
    case constants.ACTIONS.BUY: {
      method = 'buy';
      break;
    }
    case constants.ACTIONS.RENT: {
      method = 'rent';
      break;
    }
    case constants.ACTIONS.STREAM:
    default:
      method = 'stream';
      break;
  }
  return `You can ${method} ${movie} on ${prepareList(list)}!`;
};

module.exports = {
  prepareMovieList
};

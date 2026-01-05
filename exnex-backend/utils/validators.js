function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validatePassword(password) {
    return password && password.length >= 6;
}

function validateAd(ad) {
    const errors = [];
    
    if (!ad.title || ad.title.trim().length < 5) {
        errors.push('Заголовок должен быть не менее 5 символов');
    }
    
    if (!ad.description || ad.description.trim().length < 10) {
        errors.push('Описание должно быть не менее 10 символов');
    }
    
    if (ad.price && (ad.price < 0 || ad.price > 100000000)) {
        errors.push('Некорректная цена');
    }
    
    return errors;
}

module.exports = {
    validateEmail,
    validatePassword,
    validateAd
};
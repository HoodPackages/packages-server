const jwt = require('jsonwebtoken');
const User = require('../models/User.js');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization; // ожидаем: "Bearer <token>"
    if (!authHeader) {
      return res.status(401).json({ message: "Не авторизований" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Не авторизований" });
    }

    // проверка токена
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // подгружаем пользователя из БД без пароля
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "Користувач не знайдений" });
    }

    // сохраняем пользователя в req для последующего использования в роуте
    req.user = user;

    next(); // пропускаем дальше
  } catch (err) {
    console.error(err);
    res.status(401).json({ message: "Токен недійсний" });
  }
};

module.exports = authMiddleware;

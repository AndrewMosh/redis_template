const express = require("express");
const app = express();
const Redis = require("ioredis");
const redis = new Redis({
  host: "localhost", // адрес Redis сервера
  port: 6379, // порт Redis сервера
});

redis.on("error", (err) => {
  console.error(err);
});
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Credentials", true);
  next();
});
app.get("/data", (req, res) => {
  redis.get("cachedData", (err, cachedData) => {
    if (err) {
      console.error(err);
      return res.status(500).end();
    }

    if (cachedData) {
      const data = JSON.parse(cachedData);
      return res.send(createHtmlResponse(data));
    }

    const data = [
      { id: 1, name: "Писта Иванна", age: 25 },
      { id: 2, name: "Иван", age: 30 },
      { id: 3, name: "Елена", age: 35 },
    ];

    redis.setex("cachedData", 10, JSON.stringify(data), (err) => {
      if (err) {
        console.error(err);
      }
    });

    return res.send(createHtmlResponse(data));
  });
});

function createHtmlResponse(data) {
  let html = "<h1>Данные:</h1>";
  html += "<ul>";

  data.forEach((item) => {
    html += `<li>${item.name}, ${item.age} лет</li>`;
  });

  html += "</ul>";

  return html;
}

app.post("/", async (req, res) => {
  try {
    // Получаем данные из тела запроса
    const newData = req.body;

    // Сериализуем данные в формат JSON
    const jsonData = JSON.stringify(newData);

    // Пишем данные в Redis
    await redis.set("data", jsonData);

    // Отправляем ответ с сообщением об успешной записи
    res.send("Данные успешно записаны в Redis");
  } catch (error) {
    // Обработка ошибок
    console.error(error);
    res.status(500).send("Ошибка сервера");
  }
});
// Маршрут для выполнения запроса PUT
app.put("/item/:id", (req, res) => {
  const itemId = req.params.id;
  const itemData = req.body;

  // Сохранение данных в Redis
  redis.set(itemId, JSON.stringify(itemData), (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: "Internal Server Error" });
      return;
    }

    res.status(200).json({ message: "Item updated successfully" });
  });
});

// Маршрут для выполнения запроса DELETE
app.delete("/item/:id", (req, res) => {
  const itemId = req.params.id;

  // Удаление данных из Redis
  redis.del(itemId, (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: "Internal Server Error" });
      return;
    }

    res.status(200).json({ message: "Item deleted successfully" });
  });
});

app.listen(3000, () => {
  console.log("Сервер слушает порт 3000");
});

# Сервис защищенного мэтчинга данных

Данные сервис - пример реализации алгоритма защищенного мэтчинга данных между двумя разными источниками.

Задача состоит в том, чтобы сервис А мог передать в сервис Б некий набор идентификаторов, имеющихся в собственной базе.
Сервис Б мог бы сравнить набор полученных идентификаторов со своим набором и в качестве результата вернуть количество совпавших идентификаторов.
При этом важным условием является то, чтобы сервис Б не мог узнать исходное значение идентификаторов для части набора, которая несовпадает с его собственными идентификаторами.

## Описание

Для реализации описанной выше задачи предлагается следующий алгоритм:

1. К каждой строчке набора данных, передаваемого от сервиса А к сервису Б применяется необратимая криптографическая функция со случайной солью, уникальной для набора данных
2. Сервис Б, получив набор данных, применяет ту же самую криптографическую функцию к своим данным с той же солью
3. Сравнивая полученные наборы, сервис Б может определить, какое количество собственных данных совпадает с переданными

Для предотвращения подбора данных на стороне сервиса Б предлагается применять такую криптографическую функцию, при которой полный перебор возможных значений идентификаторов потребовал бы значительное количество ресурсов.

Предлагается использовать алгоритм scrypt, так как он обладает как минимум двумя подходящими свойствами:
1. Стойкость к перебору на ПЛИС
2. Обладает стандартными параметрами, которые могут влиять на его сложность. Тем самым можно варьировать сложность в зависимости от типа передаваемых данных.


## Реализация

Описанный выше алгоритм реализован в виде веб-сервиса.

Веб-сервис предоставляет HTTP API с методом POST /matching, принимающий следующие параметры в виде JSON-объекта:

* algo - алгоритм хеширования. На данный момент поддерживается только "scrypt". Обязательное
* salt - соль, обязательное
* options - объект с опциями криптографического алгоритма, необязательное. Для scrypt доступны следующие опции:
  * N - по умолчанию 4
  * p - по умолчанию 1
  * r - по умолчанию 1
* items - массив захешированных с помощью указанного алгоритма и соли идентификаторов

## Пример

Запрос:

```
curl -X POST \
  http://localhost:8080/match \
  -H 'Content-Type: application/json' \
  -H 'cache-control: no-cache' \
  -d '{
	"algo": "scrypt",
	"salt": "any salt",
	"items": [
		"4f1e70694960489718cbf5b4ce733857",
		"c827a73774ad881c7f3d72872416328b",
		"03e6ff74b6bd1a2af30f5336b1d2666d",
		"4e788846e68b029882b2d1c609dbdbf9",
		"c4318ca1641f6affa39cf82d88d2aa63"
	]
}'
```

Ответ:
```
{
    "matchedCount": 1
}
```


## Запуск

Запуск с тестовыми данными:

```
docker build -t dmp-matching . && docker run -it --rm -p 8080:8080 dmp-matching
```

Запуск со своими данными:

```
docker run -it --rm -p 8080:8080 -v "/path/to/my/own/data.txt:/app/data.txt dmp-matching
```

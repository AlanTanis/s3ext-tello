<p align="center"><img src="https://res.cloudinary.com/dtfbvvkyp/image/upload/v1566331377/laravel-logolockup-cmyk-red.svg" width="400"></p>

<p align="center">
<a href="https://travis-ci.org/laravel/framework"><img src="https://travis-ci.org/laravel/framework.svg" alt="Build Status"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://poser.pugx.org/laravel/framework/d/total.svg" alt="Total Downloads"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://poser.pugx.org/laravel/framework/v/stable.svg" alt="Latest Stable Version"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://poser.pugx.org/laravel/framework/license.svg" alt="License"></a>
</p>

## About Laravel

Laravel is a web application framework with expressive, elegant syntax. 

## About This Repo

I just imported Bootstrap and executed `npm install` and `npm run dev` on Mac. Then I clone this repo to Homestead VM hosted by a Windows machine.

**I don't why, but it works!**

## How to Use
**Step 1**
Clone this repo to your workspace:
```
git clone git@github.com:AlanTanis/laravel-npm-installed.git [project_name]
```
**Step 2**
Go to the directory and run:
```
$ npm install --no-bin-links
```

**Step 3**

Delete all `cross-env` in `package.json` file and save.

**Step 4**

```bash
$ npm run dev
```

## License

The Laravel framework is open-source software licensed under the [MIT license](https://opensource.org/licenses/MIT).

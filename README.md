```
npm install
npm run dev
```

```
open http://localhost:3000
```

Production: nginx serves `public/`; `/admin` is reverse-proxied to Node on `127.0.0.1:3000`.

```
npm run build
npm start
```

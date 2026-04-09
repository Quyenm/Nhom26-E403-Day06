# Huong dan chay giao dien `mobile`

Tai lieu nay duoc viet cho nguoi khong quen code. Chi can lam theo tung buoc ben duoi la co the mo giao dien `mobile` tren trinh duyet va chia se bang link.

## 1. Can chuan bi truoc

May tinh can co:

- `Node.js`
- `npm`
- `npx`
- `ngrok`

Neu chua co `Node.js`, hay cai ban LTS tu trang chinh thuc cua Node.js. Sau khi cai xong, mo Terminal hoac PowerShell va kiem tra:

```bash
node -v
npm -v
npx -v
```

Neu may da cai `ngrok`, kiem tra bang lenh:

```bash
ngrok version
```

## 2. Mo dung thu muc `mobile`

Mo Terminal hoac PowerShell tai thu muc goc cua du an, sau do chuyen vao folder `mobile`:

```bash
cd mobile
```

## 3. Cai thu vien neu chua co

Neu la lan dau chay, hoac sau khi duoc cap nhat code moi, hay chay:

```bash
npm install
```

Lenh nay se cai cac thu vien can thiet de giao dien hoat dong.

## 4. Chay giao dien web Expo

Tai thu muc `mobile`, chay:

```bash
npx expo start --web
```

Sau khi chay, Terminal se hien thong tin local. Thuong ban se thay mot dia chi dang:

- `http://localhost:8081`
- hoac `http://localhost:8082`

Luu y:

- Khong phai luc nao cung la `8081`
- Neu `8081` dang bi chiem, Expo co the tu doi sang `8082` hoac cong khac
- Hay nhin trong Terminal de biet dung cong nao dang duoc su dung

## 5. Mo link cong khai bang ngrok

Sau khi da chay `npx expo start --web`, mo mot cua so Terminal moi, van tai dung folder `mobile` hoac bat ky dau, roi chay:

```bash
ngrok http 8081
```

Neu Expo dang chay o cong khac, vi du `8082`, thi doi lai:

```bash
ngrok http 8082
```

Noi ngan gon:

- Neu Expo hien `localhost:8081` thi dung `ngrok http 8081`
- Neu Expo hien `localhost:8082` thi dung `ngrok http 8082`

## 6. Lay link de mo giao dien

Sau khi chay `ngrok`, man hinh se hien mot link cong khai, thuong co dang:

```text
https://xxxxx.ngrok-free.app
```

Chi can mo link nay tren trinh duyet la duoc.

Ban co the:

- Tu mo de xem giao dien
- Gui link do cho nguoi khac de ho xem tren may cua ho

## 7. Tom tat nhanh

Neu da cai san `Node.js` va `ngrok`, thi quy trinh thuong chi gom:

```bash
cd mobile
npm install
npx expo start --web
ngrok http 8081
```

Hoac neu Expo dang chay o cong khac:

```bash
ngrok http 8082
```

Sau do:

- Mo link do `ngrok` gui ra
- Dung giao dien binh thuong

## 8. Neu gap loi

Mot so truong hop thuong gap:

- `npm install` loi: kiem tra da cai `Node.js` chua
- `npx expo start --web` loi: kiem tra dang o dung folder `mobile` chua
- `ngrok http 8081` khong vao duoc: xem lai Expo dang chay cong nao, co the la `8082`
- Khong thay link `ngrok`: kiem tra `ngrok` da duoc cai va dang dang nhap thanh cong chua

## 9. Cach tat he thong

Khi khong dung nua:

- Nhan `Ctrl + C` o cua so Terminal dang chay `npx expo start --web`
- Nhan `Ctrl + C` o cua so Terminal dang chay `ngrok`

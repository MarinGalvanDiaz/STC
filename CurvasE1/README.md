# ECDSA con Spring Boot y React

Aplicación educativa que firma y valida archivos `.txt` usando criptografía de curvas elípticas (ECC). La firma se agrega como un bloque al final del mismo archivo.

El frontend también muestra la clave privada y la clave pública generadas al iniciar el backend, y presenta la firma extraída del archivo durante la validación. Esta exposición es intencional para fines didácticos y no debe utilizarse en producción.

## Biblioteca y algoritmo

El backend utiliza la API estándar de seguridad de Java (`java.security`), disponible en el JDK, por lo que no requiere una biblioteca criptográfica externa:

- `KeyPairGenerator` con el proveedor estándar del JDK.
- Curva `secp256r1` (también conocida como NIST P-256).
- Algoritmo `SHA256withECDSA`: primero calcula SHA-256 del mensaje y después genera la firma ECDSA.
- La firma y la clave pública se transportan en Base64; la clave pública se muestra en formato PEM.

La clave privada se genera al iniciar Spring Boot y permanece en memoria. Esto es apropiado para una demostración, pero en producción debe protegerse con un HSM o un almacén de claves (`KeyStore`) y gestionarse con rotación.

## Ejecución

Requisitos: Java 17+, Maven 3.9+ y Node.js 20+.

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

En otra terminal:

```powershell
cd frontend
npm install
npm run dev
```

Abre `http://localhost:5173`.

## API de archivos TXT

`POST /api/ecdsa/sign-file` (multipart/form-data, campo `file`)

Recibe un archivo TXT y devuelve el archivo firmado para descargar. El bloque agregado tiene este formato:

```text
--- FIRMA ECDSA ---
Algoritmo: SHA256withECDSA
Curva: secp256r1
Firma: <firma Base64>
```

`POST /api/ecdsa/verify-file` (multipart/form-data, campo `file`)

Extrae la línea `Firma` del bloque final, separa el contenido original y valida ambos con la clave pública conservada por el backend. La respuesta incluye la firma extraída.

`GET /api/ecdsa/keys`

Devuelve el algoritmo, la curva y ambas claves PEM para visualización educativa.

## API JSON heredada

`POST /api/ecdsa/sign`

```json
{ "message": "Mensaje de ejemplo" }
```

Devuelve la firma, el algoritmo, la curva y la clave pública necesaria para validar.

`POST /api/ecdsa/verify`

```json
{
  "message": "Mensaje de ejemplo",
  "signature": "<firma Base64>",
  "publicKey": "<clave pública PEM>"
}
```

Una firma ECDSA solo es válida si el mensaje no fue alterado y corresponde a la clave pública.

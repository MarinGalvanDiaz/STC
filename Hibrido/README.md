# Sistema Criptográfico Híbrido
### Diffie-Hellman · AES-CBC (PKCS5) · RSA-4096 · SHA-3 (SHA3-256)

Este proyecto implementa una solución completa de **criptografía híbrida** para la transferencia segura de documentos de texto (`.txt`), garantizando los cuatro pilares fundamentales de la seguridad informática:
1. **Confidencialidad:** Cifrado simétrico robusto mediante **AES-CBC** (128/256 bits).
2. **Integridad:** Cálculo del resumen criptográfico mediante **SHA-3 (SHA3-256)**.
3. **Autenticidad y No Repudio:** Firma digital asimétrica con **RSA de 4096 bits**.
4. **Acuerdo Seguro de Claves:** Intercambio de claves sin canal seguro previo mediante **Diffie-Hellman**.

---

## 1. Arquitectura del Proyecto

El sistema se compone de dos capas desacopladas que se comunican vía API REST:

```
Hibrido/
├── backend/                  # Servidor API REST en Spring Boot (Java)
│   ├── src/main/java/com/hibrido/backend/
│   │   ├── controller/CryptoController.java   # Endpoints de cifrado/descifrado AES
│   │   └── service/AesCryptoService.java      # Motor criptográfico AES-CBC
│   └── pom.xml
│
├── frontend/                 # Aplicación SPA interactiva en React + Vite
│   ├── src/
│   │   ├── components/
│   │   │   ├── DiffieHellmanView.jsx          # Módulo didáctico de intercambio DH
│   │   │   ├── AesCipherView.jsx              # Cifrado/descifrado AES de archivos .txt
│   │   │   └── RsaSignatureView.jsx           # Doble selector de firma y verificación SHA-3
│   │   ├── utils/cryptoUtils.js               # Matemáticas BigInt, RSA-4096, SHA-3, UTF-8
│   │   ├── App.jsx                            # Shell principal y comprobación de salud
│   │   └── App.css                            # Diseño responsivo en paleta Sage Muted
│   └── package.json
└── README.md
```

---

## 2. Bibliotecas y Tecnologías Empleadas

### Backend (Java / Spring Boot)
- **Java 17+ / Java 19**: Plataforma base de ejecución.
- **Spring Boot 4.x / 3.x (`spring-boot-starter-web`)**: Exposición de endpoints REST y manejo de cargas de archivos `MultipartFile`.
- **Java Cryptography Extension (JCE)**:
  - `javax.crypto.Cipher`: Implementación certificada de `AES/CBC/PKCS5Padding`.
  - `javax.crypto.spec.SecretKeySpec` y `IvParameterSpec`: Manejo de claves simétricas de 128/256 bits y vectores de inicialización (IV) de 16 bytes.
  - `java.security.MessageDigest`: Derivación auxiliar SHA-256 para normalización de claves.
  - `java.nio.charset.StandardCharsets`: Codificación estricta en `UTF-8`.

### Frontend (React / JavaScript)
- **React 18/19 & Vite**: Interfaz de usuario reactiva, modular y de alto rendimiento.
- **`js-sha3`**: Biblioteca estándar y verificada para el cálculo del resumen criptográfico seguro **SHA-3 (SHA3-256)** conforme a FIPS 202.
- **JavaScript BigInt**: Aritmética de precisión arbitraria para el cálculo de números primos grandes y exponenciación modular rápida en Diffie-Hellman y RSA.
- **Web Crypto API**: Generación criptográficamente segura de números pseudoaleatorios (`crypto.getRandomValues`) para llaves AES, IVs y pares de claves.
- **`TextDecoder('utf-8')` y `TextEncoder`**: Procesamiento estricto a nivel de bytes para garantizar que ningún carácter especial (tildes, `ñ`, `¿`, emojis) o salto de línea (`\n`, `\r\n`) se modifique.

---

## 3. Explicación Detallada de Cada Módulo

### Módulo 1: Intercambio de Claves Diffie-Hellman (DH)
Permite a dos partes (Alice y Bob) acordar una clave secreta a través de un canal inseguro.
1. **Parámetros Públicos:**
   - Número primo $p$ y generador (raíz primitiva) $g$.
   - La aplicación incluye presets didácticos (primos pequeños para demostración manual) y el estándar criptográfico **RFC 3526 (Grupo 14 MODP - 2048 bits)**.
2. **Claves Privadas:**
   - Alice elige un secreto privado $a$.
   - Bob elige un secreto privado $b$.
3. **Claves Públicas:**
   - Alice calcula y envía a Bob: $A = g^a \pmod p$.
   - Bob calcula y envía a Alice: $B = g^b \pmod p$.
4. **Secreto Compartido:**
   - Alice calcula: $K = B^a \pmod p$.
   - Bob calcula: $K = A^b \pmod p$.
   - Dado que $(g^b)^a \equiv (g^a)^b \equiv g^{ab} \pmod p$, ambos obtienen exactamente el mismo valor de $K$.
5. **Derivación a Clave AES:**
   - El valor $K$ se convierte a formato hexadecimal y se ajusta a una clave de 16 bytes (AES-128) o 32 bytes (AES-256).
   - Incluye el botón **"Usar esta clave en el Cifrador AES"** que traslada la clave directamente al Módulo 2.

---

### Módulo 2: Cifrador y Descifrador AES-CBC
Gestiona el procesamiento simétrico de archivos de texto (`.txt`).
- **Cifrado:**
  - Requiere un archivo `.txt`, una clave AES (de 16 o 32 caracteres) y un Vector Inicial (IV) de 16 caracteres (128 bits).
  - El backend ejecuta `AES/CBC/PKCS5Padding`.
  - El criptograma resultante se codifica en **Base64** para permitir su descarga segura en un archivo `.txt` (`cifrado_<nombre>.txt`).
- **Descifrado:**
  - El usuario ingresa la misma clave e IV.
  - Si el archivo contiene una firma digital al final, el sistema **detecta automáticamente el delimitador `Firma digital`**, aísla el criptograma para descifrarlo con AES y vuelve a anexar la firma al final del texto plano descifrado.
  - El archivo resultante se descarga automáticamente como `descifrado_<nombre>.txt`.

---

### Módulo 3: Firma Digital y Verificación RSA-4096 con SHA-3
Garantiza la autenticidad e integridad del documento mediante firma asimétrica.

#### A. Firma Digital con Doble Selector de Archivos
Para evitar fallas de verificación, el proceso separa con precisión los dos insumos necesarios:
1. **Selector 1 (Texto Plano):**
   - Archivo `.txt` original sobre el cual se calcula el digesto **SHA-3 (SHA3-256)** de 64 caracteres hexadecimales.
2. **Selector 2 (Archivo Cifrado):**
   - Archivo que contiene el criptograma generado por AES.
3. **Generación de la Firma:**
   - Se firma el digesto SHA-3 con la Clave Privada RSA-4096 del emisor ($S = (EM)^d \pmod n$).
4. **Concatenación:**
   - Se anexa la firma al final del archivo cifrado con la siguiente estructura:
     ```text
     <Criptograma_Base64>
     Firma digital
     <Firma_RSA_Base64>
     ```
   - Se descarga como `firmado_<nombre_cifrado>.txt`.

#### B. Traslado Automático desde AES
- Al procesar el cifrado en el Módulo 2, el texto plano original se traslada automáticamente al **Selector 1** de firma, y el criptograma generado se traslada automáticamente al **Selector 2**.

#### C. Verificación de la Firma Digital
1. El usuario sube el archivo a verificar (o pega el contenido y firma manualmente).
2. El sistema detecta el delimitador `Firma digital`, extrayendo:
   - El **contenido previo** (mensaje).
   - La **firma digital** en Base64.
3. El usuario ingresa la **Clave Pública RSA (PEM)** del firmante.
4. **Proceso de Comparación Criptográfica:**
   - Se calcula el digesto SHA-3 del mensaje previo a la firma: $D_{calc} = \text{SHA3-256}(mensaje)$.
   - Se descifra la firma con la clave pública RSA ($EM' = S^e \pmod n$) y se extrae el digesto almacenado: $D_{desc}$.
   - Se comparan explícitamente: si $D_{calc} == D_{desc}$, la firma es **VÁLIDA**.

---

## 4. Diagrama del Flujo de Trabajo

```
[EMISOR: Alice]
  1. Acuerda la clave AES con Diffie-Hellman.
  2. Cifra el documento original (ej. 'mensaje.txt') con AES-CBC.
     └─► Genera 'cifrado_mensaje.txt'.
  3. Firma Digital:
     ├─ Selector 1 (Plano):    'mensaje.txt' ────► SHA-3 ──► Firma RSA con Clave Privada
     └─ Selector 2 (Cifrado):  'cifrado_mensaje.txt' ───┐            │
                                                        ▼            ▼
     Concatena al final: ──────────────────────► 'cifrado_mensaje.txt'
                                                 Firma digital
                                                 <Firma_Base64>
     (Descarga: 'firmado_cifrado_mensaje.txt')

                  ═══ ENVIADO POR CANAL INSEGURO ═══
                                  │
                                  ▼
[RECEPTOR: Bob]
  4. Descifra con AES:
     - Sube 'firmado_cifrado_mensaje.txt'.
     - El sistema excluye la firma y descifra el criptograma con la clave acordada.
     - Reasocia la firma al texto descifrado:
         <Texto plano descifrado>
         Firma digital
         <Firma_Base64>
     (Descarga: 'descifrado_firmado_cifrado_mensaje.txt')

  5. Verifica la Firma:
     - Sube el archivo descifrado.
     - Pega la Clave Pública RSA de Alice.
     - Se compara: SHA-3(Texto Descifrado) == Descifrar_RSA(Firma).
     - Resultado: ¡FIRMA VÁLIDA Y AUTÉNTICA!
```

---

## 5. Instalación y Puesta en Marcha

### Requisitos Previos
- **Java JDK 17** o superior instalado y configurado en el `PATH`.
- **Node.js 18+** y `npm` instalados.

### Paso 1: Ejecutar el Backend (Spring Boot)
Abre una terminal en la carpeta `backend/`:
```bash
# En Windows (PowerShell / CMD):
.\mvnw.cmd spring-boot:run

# En Linux / macOS:
./mvnw spring-boot:run
```
El backend iniciará en el puerto **`8081`**. Puedes verificar su estado en:
`http://localhost:8081/api/crypto/health`

### Paso 2: Ejecutar el Frontend (React + Vite)
Abre otra terminal en la carpeta `frontend/`:
```bash
# Instalar dependencias:
npm install

# Iniciar servidor de desarrollo:
npm run dev
```
La aplicación web estará disponible en:
**`http://localhost:5173`**

---

## 6. Ejemplo Integrador Paso a Paso

Sigue este ejemplo guiado para comprobar la solución de principio a fin:

### Paso A: Generar las Claves RSA
1. Entra a la aplicación en `http://localhost:5173`.
2. Ve a la pestaña **"2. Cifrador AES y Firma RSA"**.
3. En la sección inferior, despliega **"Generador de Claves RSA (4096 bits)"** y haz clic en **"Generar Nuevo Par RSA-4096"**.
4. Copia y guarda temporalmente la **Clave Privada** y la **Clave Pública**.

### Paso B: Intercambio Diffie-Hellman
1. Ve a la pestaña **"1. Diffie-Hellman"**.
2. Selecciona el preset **"Educativo mediano (p=353, g=3)"** o **"RFC 3526"**.
3. Haz clic en **"Generar"** para la clave privada de Alice ($a$) y para la de Bob ($b$).
4. Comprueba que ambos calculan el mismo secreto compartido $K$.
5. Haz clic en **"Usar esta clave en el Cifrador AES"**.

### Paso C: Cifrado del Documento
1. En la pestaña de Cifrado AES, haz clic en **"Examinar Archivo (.txt)"** y sube un archivo (por ejemplo, con texto con tildes y saltos de línea):
   ```text
   Documento de prueba para Criptosistema Híbrido.
   Contiene acentos: á, é, í, ó, ú, ñ y saltos de línea.

   ```
2. Genera un IV de 16 bytes haciendo clic en **"Generar 16B"** (guarda este IV para el descifrado).
3. Haz clic en **"Cifrar con AES-CBC y Descargar .txt"**.
   - Se descargará el archivo `cifrado_<tu_archivo>.txt`.

### Paso D: Firma Digital
1. Desplázate a la sección **"Firma Digital y Verificación"** (pestaña **"Firmar Archivo"**).
2. Observa cómo el archivo plano original y el archivo cifrado se trasladaron automáticamente a sus respectivos selectores.
3. Pega la **Clave Privada RSA** generada en el Paso A.
4. Haz clic en **"Firmar con RSA-4096"**.
5. Haz clic en **"Descargar Archivo Cifrado con Firma (.txt)"**.
   - Se descargará el archivo `firmado_cifrado_<tu_archivo>.txt`.

### Paso E: Descifrado y Preservación de Firma
1. En la parte superior de la vista AES, selecciona el modo **"Descifrar Archivo .txt"**.
2. Sube el archivo `firmado_cifrado_<tu_archivo>.txt`.
3. Verás una notificación en verde: `Firma digital detectada`.
4. Asegúrate de tener la misma llave AES y el mismo IV usados al cifrar.
5. Haz clic en **"Descifrar con AES-CBC y Descargar .txt"**.
   - Se descargará `descifrado_firmado_cifrado_<tu_archivo>.txt`.

### Paso F: Verificación Exitosa
1. En la sección de firma, ve a la pestaña **"Verificar Firma de Archivo"**.
2. Sube el archivo recién descifrado en el selector de verificación.
   - El sistema extraerá automáticamente el mensaje descifrado y la firma digital en Base64.
3. Pega la **Clave Pública RSA** de Alice (del Paso A).
4. Haz clic en **"Verificar Firma (SHA-3)"**.
5. **Resultado:**
   - La aplicación mostrará en verde: **"¡Firma Digital VÁLIDA y Auténtica!"**.
   - Mostrará la comparación exacta del **Digesto SHA-3 calculado** frente al **Digesto descifrado de la firma**, demostrando que el documento no sufrió alteración alguna en sus bytes, tildes o saltos de línea.


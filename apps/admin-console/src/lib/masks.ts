export function maskCPF(value: string) {
  return value
    .replace(/\D/g, "")                     
    .replace(/(\d{3})(\d)/, "$1.$2")        // coloca o primeiro ponto
    .replace(/(\d{3})(\d)/, "$1.$2")        // coloca o segundo ponto
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2")  // coloca o traço
    .substring(0, 14);                      // garante tamanho máximo
}

export function maskDate(value: string) {
  return value
    .replace(/\D/g, "")                  // remove tudo que não é número
    .replace(/(\d{2})(\d)/, "$1/$2")     // coloca a primeira /
    .replace(/(\d{2})(\d)/, "$1/$2")     // coloca a segunda /
    .substring(0, 10);                   // limita em DD/MM/AAAA
}

export function maskPhone(value: string) {
  return value
    .replace(/\D/g, "")                         // remove tudo que não é número
    .replace(/^(\d{2})(\d)/, "($1) $2")         // adiciona DDD: (xx)
    .replace(/(\d{5})(\d)/, "$1-$2")            // adiciona hífen: 99999-9999
    .substring(0, 15);                          // limita no tamanho máximo
}

export function maskPlate(value: string) {
  // keep only letters and numbers, uppercase
  const raw = (value ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");

  if (!raw) return "";

  // if user already typed something that looks like Mercosul:
  // Mercosul pattern uses a digit at position 4 (index 3) in LLLNLNN
  if (raw.length >= 4 && /\d/.test(raw[3])) {
    // build mercosul progressively: LLL N L NN
    const part = raw.slice(0, 7); // max 7 chars
    // return without separator: "ABC1D23"
    return part;
  }

  // otherwise format as old pattern: LLL-NNNN (with hyphen)
  const letters = raw.slice(0, 3);
  const numbers = raw.slice(3, 7); // up to 4 digits
  return numbers ? `${letters}-${numbers}`.slice(0, 8) : letters;
}

export function maskFipeCode(value: string) {
  return value
    .replace(/\D/g, "")               // só números
    .slice(0, 7)                      // limita a 7 dígitos
    .replace(/(\d{6})(\d)/, "$1-$2"); // insere o hífen antes do último dígito
}

export function maskBRL(value: string) {
  // remove tudo que não for número
  const onlyNumbers = value.replace(/\D/g, "");

  // se estiver vazio
  if (!onlyNumbers) return "";

  // transforma em centavos (divide por 100)
  const numberValue = (parseInt(onlyNumbers, 10) / 100).toFixed(2);

  // formata para padrão brasileiro
  return numberValue
    .replace(".", ",")               // decimal com vírgula
    .replace(/\B(?=(\d{3})+(?!\d))/g, "."); // separador de milhar
}

export function maskCEP(value: string) {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{5})(\d)/, "$1-$2")
    .substring(0, 9);
}

export function unmaskCPF(value: string) {
  return (value ?? "").replace(/\D/g, "");
}
// Positive, normalized scientific numbers. Exponents are never converted to IEEE magnitudes.
export class Big {
  constructor(m = 0, e = 0) {
    if (m instanceof Big) {
      this.m = m.m;
      this.e = m.e;
      return;
    }
    if (typeof m === "object" && m) {
      e = m.e;
      m = m.m;
    }
    if (!Number.isFinite(m) || !Number.isFinite(e) || m < 0)
      throw Error("Número inválido");
    if (!m) {
      this.m = 0;
      this.e = 0;
      return;
    }
    let n = Math.floor(Math.log10(m));
    this.m = (m / 10 ** n) * 10 ** (e - Math.floor(e));
    this.e = Math.floor(e) + n;
    if (this.m >= 10) {
      this.m /= 10;
      this.e++;
    }
  }
  static from(v) {
    return v instanceof Big ? v : new Big(v);
  }
  add(v) {
    v = Big.from(v);
    if (!this.m) return new Big(v);
    if (!v.m) return new Big(this);
    let a = this,
      b = v;
    if (a.e < b.e) [a, b] = [b, a];
    return new Big(a.m + (a.e - b.e > 16 ? 0 : b.m * 10 ** (b.e - a.e)), a.e);
  }
  sub(v) {
    v = Big.from(v);
    if (this.cmp(v) <= 0) return new Big();
    return new Big(
      this.m - (this.e - v.e > 16 ? 0 : v.m * 10 ** (v.e - this.e)),
      this.e,
    );
  }
  mul(v) {
    v = Big.from(v);
    return new Big(this.m * v.m, this.e + v.e);
  }
  div(v) {
    v = Big.from(v);
    if (!v.m) throw Error("Divisão por zero");
    return new Big(this.m / v.m, this.e - v.e);
  }
  pow(p) {
    if (!this.m) return new Big();
    let n = (Math.log10(this.m) + this.e) * p;
    return new Big(10 ** (n - Math.floor(n)), Math.floor(n));
  }
  cmp(v) {
    v = Big.from(v);
    if (!this.m || !v.m) return Math.sign(this.m - v.m);
    return this.e === v.e ? Math.sign(this.m - v.m) : Math.sign(this.e - v.e);
  }
  log() {
    return this.m ? Math.log10(this.m) + this.e : 0;
  }
  number() {
    return this.m * 10 ** Math.min(308, this.e);
  }
  toJSON() {
    return { m: this.m, e: this.e };
  }
  format(scientific = false) {
    if (!this.m) return "0";
    if (this.e < 3)
      return this.number().toLocaleString("pt-BR", {
        maximumFractionDigits: this.e < 1 ? 1 : 0,
      });
    const suffix = [
      "",
      "mil",
      "mi",
      "bi",
      "tri",
      "qa",
      "qi",
      "sx",
      "sp",
      "oc",
      "no",
      "dc",
    ];
    let g = Math.floor(this.e / 3);
    if (!scientific && g < suffix.length)
      return `${(this.m * 10 ** (this.e % 3)).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} ${suffix[g]}`;
    return `${this.m.toFixed(2)}e${this.e}`;
  }
}
export const B = (v) => Big.from(v);

export class CurrencySystem {
  constructor(totalSilver = 0) {
    this._totalSilver = Math.max(0, Math.floor(totalSilver));
  }

  get totalSilver() {
    return this._totalSilver;
  }

  addSilver(n) {
    this._totalSilver += Math.max(0, Math.floor(n));
  }

  addGold(n) {
    this.addSilver(Math.floor(n) * 100);
  }

  spend(silverCost) {
    const cost = Math.floor(silverCost);
    if (cost > this._totalSilver) return false;
    this._totalSilver -= cost;
    return true;
  }

  toString() {
    const gold   = Math.floor(this._totalSilver / 100);
    const silver = this._totalSilver % 100;
    return `${gold}G ${silver}S`;
  }
}

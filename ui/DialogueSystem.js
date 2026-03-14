/**
 * DialogueSystem — pure JS, no Phaser dependency.
 *
 * Manages NPC dialogue state: which page is active, options available,
 * and whether a conversation is currently open.
 *
 * Dialogue data format:
 * {
 *   pages: [
 *     { text: string, options: string[] }  // options: [] = linear, [...] = branching
 *   ]
 * }
 */
export class DialogueSystem {
  constructor() {
    this._dialogues    = {};  // npcId → dialogue data
    this._currentPages = null;
    this._pageIndex    = 0;
    this._open         = false;
  }

  /**
   * Register dialogue data for an NPC (used directly in tests and for pre-loaded data).
   * @param {string} npcId
   * @param {{ pages: Array<{ text: string, options: string[] }> }} dialogueData
   */
  register(npcId, dialogueData) {
    this._dialogues[npcId] = dialogueData;
  }

  /**
   * Start dialogue for an NPC.
   * @param {string} npcId
   * @returns {{ text: string, options: string[] } | null}  first page, or null if npcId unknown
   */
  start(npcId) {
    const data = this._dialogues[npcId];
    if (!data || !data.pages || data.pages.length === 0) return null;

    this._currentPages = data.pages;
    this._pageIndex    = 0;
    this._open         = true;
    return this.current();
  }

  /**
   * Returns the current page, or null if no dialogue is open.
   * @returns {{ text: string, options: string[] } | null}
   */
  current() {
    if (!this._open || !this._currentPages) return null;
    return this._currentPages[this._pageIndex];
  }

  /**
   * Advance to the next page (for linear dialogue or after choosing an option).
   * Closes dialogue when the last page is reached.
   * @returns {{ text: string, options: string[] } | null}  next page, or null when done
   */
  next() {
    if (!this._open) return null;
    this._pageIndex++;
    if (this._pageIndex >= this._currentPages.length) {
      this.close();
      return null;
    }
    return this.current();
  }

  /**
   * Select a branching option by index.
   * For now this simply advances to the next page (full branching trees can be
   * added later without changing the API).
   * @param {number} optionIndex
   * @returns {{ text: string, options: string[] } | null}
   */
  choose(optionIndex) {
    return this.next();
  }

  /** @returns {boolean} */
  isOpen() {
    return this._open;
  }

  close() {
    this._open         = false;
    this._currentPages = null;
    this._pageIndex    = 0;
  }
}

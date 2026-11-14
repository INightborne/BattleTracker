import { CombatManager, ParticipantList, IParticipant, StatusEnum } from 'Combat';
import { Participant } from 'Combat/Participants/Participant';
import { Action } from 'Interfaces/Action';

const STORAGE_KEY = 'battletracker.encounter.v1';
const FORMAT = 'battle-tracker';

interface SavedParticipant {
  name: string;
  waiting: boolean;
  finished: boolean;
  active: boolean;
  baseIni: number;
  diceIni: number;
  dices: number;
  hasPainEditor: boolean;
  ooc: boolean;
  edge: boolean;
  status: StatusEnum;
  painTolerance: number;
  overflowHealth: number;
  physicalHealth: number;
  stunHealth: number;
  physicalDamage: number;
  stunDamage: number;
  sortOrder: number;
  actionHistory: Action[];
}

export interface BattleSnapshot {
  format: 'battle-tracker';
  version: 1;
  combat: {
    started: boolean;
    passEnded: boolean;
    combatTurn: number;
    initiativePass: number;
    currentInitiative: number | null;
    nextSortOrder: number;
  };
  participants: SavedParticipant[];
  activeActorIndexes: number[];
  selectedActorIndex: number | null;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

/**
 * Everything is stored locally in the current browser. No cookies, account,
 * or server is needed. This format is also used for portable JSON backups.
 */
export class BattlePersistence {
  static capture(selectedActor: IParticipant | null): BattleSnapshot {
    const people = CombatManager.participants.items;
    return {
      format: 'battle-tracker',
      version: 1,
      combat: {
        started: CombatManager.started,
        passEnded: CombatManager.passEnded,
        combatTurn: CombatManager.combatTurn,
        initiativePass: CombatManager.initiativePass,
        currentInitiative: Number.isFinite(CombatManager.currentInitiative)
          ? CombatManager.currentInitiative : null,
        nextSortOrder: CombatManager.nextSortOrder
      },
      participants: people.map(p => ({
        name: p.name,
        waiting: p.waiting,
        finished: p.finished,
        active: p.active,
        baseIni: p.baseIni,
        diceIni: p.diceIni,
        dices: p.dices,
        hasPainEditor: p.hasPainEditor,
        ooc: p.ooc,
        edge: p.edge,
        status: p.status,
        painTolerance: p.painTolerance,
        overflowHealth: p.overflowHealth,
        physicalHealth: p.physicalHealth,
        stunHealth: p.stunHealth,
        physicalDamage: p.physicalDamage,
        stunDamage: p.stunDamage,
        sortOrder: p.sortOrder,
        actionHistory: p.actionHistory.map(action => ({
          key: action.key,
          iniMod: action.iniMod,
          ...(action.persist === undefined ? {} : { persist: action.persist }),
          ...(action.martialArt === undefined ? {} : { martialArt: action.martialArt }),
          ...(action.edge === undefined ? {} : { edge: action.edge })
        }))
      })),
      activeActorIndexes: CombatManager.currentActors.items
        .map(actor => people.indexOf(actor))
        .filter(index => index >= 0),
      selectedActorIndex: selectedActor === null || !people.includes(selectedActor)
        ? null : people.indexOf(selectedActor)
    };
  }

  static save(snapshot: BattleSnapshot): void {
    localStorage.setItem(STORAGE_KEY, this.toJSON(snapshot));
  }

  static load(): BattleSnapshot | null {
    const content = localStorage.getItem(STORAGE_KEY);
    return content === null ? null : this.parse(content);
  }

  static toJSON(snapshot: BattleSnapshot, pretty = false): string {
    return JSON.stringify(
      { ...snapshot, savedAt: new Date().toISOString() },
      null,
      pretty ? 2 : undefined
    );
  }

  static parse(json: string): BattleSnapshot {
    if (json.length > 2_000_000) {
      throw new Error('The file is too large (maximum 2 MB).');
    }
    let data: unknown;
    try {
      data = JSON.parse(json);
    } catch {
      throw new Error('The file is not valid JSON.');
    }
    if (!isObject(data) || data.format !== FORMAT || data.version !== 1) {
      throw new Error('This is not a supported BattleTracker save file (version 1).');
    }
    if (!Array.isArray(data.participants) || data.participants.length > 500) {
      throw new Error('Invalid participant list.');
    }
    const combat = data.combat;
    if (!isObject(combat) ||
        !isBoolean(combat.started) || !isBoolean(combat.passEnded) ||
        !isFiniteNumber(combat.combatTurn) || combat.combatTurn < 1 ||
        !isFiniteNumber(combat.initiativePass) || combat.initiativePass < 1 ||
        !isFiniteNumber(combat.nextSortOrder) || combat.nextSortOrder < 0 ||
        !(combat.currentInitiative === null || isFiniteNumber(combat.currentInitiative))) {
      throw new Error('Invalid combat state.');
    }

    const booleanFields = ['waiting', 'finished', 'active', 'hasPainEditor', 'ooc', 'edge'];
    const numberFields = [
      'baseIni', 'diceIni', 'dices', 'painTolerance', 'overflowHealth',
      'physicalHealth', 'stunHealth', 'physicalDamage', 'stunDamage', 'sortOrder'
    ];
    for (const participant of data.participants) {
      if (!isObject(participant) || typeof participant.name !== 'string' ||
          participant.name.length > 500 ||
          !Number.isInteger(participant.status) ||
          (participant.status as number) < 0 || (participant.status as number) > 4 ||
          booleanFields.some(field => !isBoolean(participant[field])) ||
          numberFields.some(field => !isFiniteNumber(participant[field])) ||
          !Array.isArray(participant.actionHistory) ||
          participant.actionHistory.length > 500) {
        throw new Error('Invalid participant data.');
      }
      for (const action of participant.actionHistory) {
        if (!isObject(action) || typeof action.key !== 'string' ||
            action.key.length > 200 || !isFiniteNumber(action.iniMod) ||
            ['persist', 'martialArt', 'edge'].some(field =>
              action[field] !== undefined && !isBoolean(action[field]))) {
          throw new Error('Invalid interrupt action data.');
        }
      }
    }

    const participantCount = data.participants.length;
    const validIndex = (index: unknown) =>
      Number.isInteger(index) && (index as number) >= 0 &&
      (index as number) < participantCount;
    if (!Array.isArray(data.activeActorIndexes) ||
        data.activeActorIndexes.some(index => !validIndex(index)) ||
        new Set(data.activeActorIndexes).size !== data.activeActorIndexes.length ||
        !(data.selectedActorIndex === null || validIndex(data.selectedActorIndex))) {
      throw new Error('Invalid active or selected participant.');
    }
    return data as unknown as BattleSnapshot;
  }

  static restore(snapshot: BattleSnapshot): IParticipant | null {
    const people = new ParticipantList();
    for (const entry of snapshot.participants) {
      const person = new Participant();
      person.name = entry.name;
      person.waiting = entry.waiting;
      person.finished = entry.finished;
      person.active = entry.active;
      person.baseIni = entry.baseIni;
      person.diceIni = entry.diceIni;
      person.dices = entry.dices;
      person.hasPainEditor = entry.hasPainEditor;
      person.ooc = entry.ooc;
      person.edge = entry.edge;
      person.status = entry.status;
      person.painTolerance = entry.painTolerance;
      person.overflowHealth = entry.overflowHealth;
      person.physicalHealth = entry.physicalHealth;
      person.stunHealth = entry.stunHealth;
      person.physicalDamage = entry.physicalDamage;
      person.stunDamage = entry.stunDamage;
      person.sortOrder = entry.sortOrder;
      person.actionHistory = entry.actionHistory.map(action => ({ ...action }));
      people.insert(person, false);
    }

    const active = new ParticipantList();
    for (const index of snapshot.activeActorIndexes) {
      active.insert(people.items[index], false);
    }

    CombatManager.participants = people;
    CombatManager.currentActors = active;
    CombatManager.nextSortOrder = Math.max(
      snapshot.combat.nextSortOrder, 0, ...people.items.map(person => person.sortOrder + 1)
    );
    CombatManager.started = snapshot.combat.started;
    CombatManager.passEnded = snapshot.combat.passEnded;
    CombatManager.combatTurn = snapshot.combat.combatTurn;
    CombatManager.initiativePass = snapshot.combat.initiativePass;
    CombatManager.currentInitiative = snapshot.combat.currentInitiative ?? NaN;

    return snapshot.selectedActorIndex === null
      ? null : people.items[snapshot.selectedActorIndex];
  }
}

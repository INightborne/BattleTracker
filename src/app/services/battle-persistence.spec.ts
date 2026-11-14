import { BattlePersistence } from './battle-persistence';
import { CombatManager, ParticipantList, StatusEnum } from 'Combat';
import { Participant } from 'Combat/Participants/Participant';
import { UndoHandler } from 'Common';

describe('BattlePersistence', () => {
  beforeEach(() => {
    localStorage.removeItem('battletracker.encounter.v1');
    UndoHandler.Initialize();
    CombatManager.participants = new ParticipantList();
    CombatManager.currentActors = new ParticipantList();
    CombatManager.started = false;
    CombatManager.passEnded = true;
    CombatManager.combatTurn = 1;
    CombatManager.initiativePass = 1;
    CombatManager.nextSortOrder = 0;
    CombatManager.currentInitiative = NaN;
  });

  it('round-trips combat state, active participant, damage and actions', () => {
    const actor = new Participant();
    actor.name = 'Runner';
    actor.physicalDamage = 5;
    actor.baseIni = 10;
    actor.diceIni = 12;
    actor.status = StatusEnum.Active;
    actor.actionHistory = [{ key: 'fullDefense', iniMod: -10, persist: true }];
    CombatManager.participants.insert(actor, false);
    CombatManager.currentActors.insert(actor, false);
    CombatManager.started = true;
    CombatManager.passEnded = false;
    CombatManager.combatTurn = 3;
    CombatManager.initiativePass = 2;
    CombatManager.currentInitiative = 12;

    const snapshot = BattlePersistence.capture(actor);
    const imported = BattlePersistence.parse(BattlePersistence.toJSON(snapshot));
    const selected = BattlePersistence.restore(imported);

    expect(selected?.name).toBe('Runner');
    expect(selected?.physicalDamage).toBe(5);
    expect(CombatManager.combatTurn).toBe(3);
    expect(CombatManager.initiativePass).toBe(2);
    expect(CombatManager.currentActors.items[0]).toBe(selected);
    expect(selected?.isInFullDefense()).toBe(true);
    expect(selected?.canUseAction({ key: 'fullDefense', iniMod: -10, persist: true })).toBe(false);
  });

  it('stores and loads data without a network connection', () => {
    const actor = new Participant();
    actor.name = 'A';
    CombatManager.participants.insert(actor, false);
    BattlePersistence.save(BattlePersistence.capture(actor));
    const loaded = BattlePersistence.load();
    expect(loaded?.participants[0].name).toBe('A');
  });

  it('rejects invalid imports before altering the current battle', () => {
    expect(() => BattlePersistence.parse('{invalid')).toThrow();
    expect(() => BattlePersistence.parse(JSON.stringify({
      format: 'battle-tracker', version: 999, participants: []
    }))).toThrow();
    const actor = new Participant();
    CombatManager.participants.insert(actor, false);
    const json = BattlePersistence.capture(actor);
    json.activeActorIndexes = [10];
    expect(() => BattlePersistence.parse(JSON.stringify(json))).toThrow();
  });
});

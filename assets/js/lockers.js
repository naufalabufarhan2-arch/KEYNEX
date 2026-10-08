/**
 * KEYNEX Lockers Page Controller
 * 16-Slot Interactive Visual Locker Grid, Hardware State Simulation (Solenoid & Sensor)
 */

document.addEventListener('DOMContentLoaded', async () => {
  await KEYNEXStore.init();
  renderLockerMatrix();
});

function renderLockerMatrix() {
  const container = document.getElementById('locker-matrix-container');
  if (!container) return;

  const lockers = KEYNEXStore.getLockers();

  container.innerHTML = lockers.map(l => {
    const slotStr = String(l.slot).padStart(2, '0');
    
    // Sensor status
    const sensorText = l.sensor ? 'Kunci Ada' : 'Kunci Tidak Ada';
    const sensorClass = l.sensor ? 'sensor-on' : 'sensor-off';

    // Solenoid status
    const solenoidText = l.solenoid ? 'UNLOCK' : 'LOCK';
    const solenoidClass = l.solenoid ? 'unlock' : 'lock';

    // Key status text & color badge
    let keyStatusLabel = l.key_status.replace('_', ' ').toUpperCase();
    let badgeColor = 'var(--accent-green)';
    if (l.key_status === 'digunakan') badgeColor = 'var(--accent-red)';
    if (l.key_status === 'akan_digunakan') badgeColor = 'var(--accent-yellow)';

    return `
      <div class="locker-cell ${l.solenoid ? 'active-unlocked' : ''}">
        <div class="locker-head">
          <div class="locker-slot-num">SLOT ${slotStr}</div>
          <div class="locker-room-name">${l.ruangan}</div>
        </div>

        <div class="locker-status-block">
          <div class="hw-status-row">
            <span style="color:var(--text-muted)">Status Kunci:</span>
            <span style="font-weight:700; color:${badgeColor}">${keyStatusLabel}</span>
          </div>
          <div class="hw-status-row">
            <span style="color:var(--text-muted)">Sensor:</span>
            <span class="hw-tag ${sensorClass}">${sensorText}</span>
          </div>
          <div class="hw-status-row">
            <span style="color:var(--text-muted)">Solenoid:</span>
            <span class="hw-tag ${solenoidClass}">${solenoidText}</span>
          </div>
        </div>

        <div class="locker-actions">
          ${!l.sensor ? `
            <button class="btn-sm-action" onclick="handleReturnKey(${l.slot})">
              <i class="fa-solid fa-arrow-down-to-bracket"></i> Kembalikan Kunci
            </button>
          ` : `
            <button class="btn-sm-action" onclick="handleToggleSolenoid(${l.slot})">
              <i class="fa-solid ${l.solenoid ? 'fa-lock' : 'fa-lock-open'}"></i> ${l.solenoid ? 'Lock' : 'Test Unlock'}
            </button>
          `}
        </div>
      </div>
    `;
  }).join('');
}

// Global window actions for inline onclick calls
window.handleReturnKey = function(slotNum) {
  const success = KEYNEXStore.returnKeyBySlot(slotNum);
  if (success) {
    alert(`Kunci Slot ${String(slotNum).padStart(2,'0')} berhasil dikembalikan. Solenoid Mengunci.`);
    renderLockerMatrix();
  }
};

window.handleToggleSolenoid = function(slotNum) {
  const lockers = KEYNEXStore.getLockers();
  const locker = lockers.find(l => l.slot === slotNum);
  if (locker) {
    locker.solenoid = !locker.solenoid;
    KEYNEXStore.saveLockers(lockers);
    KEYNEXStore.addActivity('hardware_test', `Manual Solenoid Toggle Slot ${slotNum}: ${locker.solenoid ? 'UNLOCK' : 'LOCK'}`, { slot: slotNum });
    renderLockerMatrix();
  }
};

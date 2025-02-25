// Saves options to chrome.storage
const saveOptions = () => {
    const closeUponSaving = document.getElementById('closeUponSaving').checked;
  
    chrome.storage.sync.set(
      { closeUponSaving: closeUponSaving },
      () => {
        // Update status to let user know options were saved.
        const status = document.getElementById('status');
        status.textContent = 'Options saved.';
        setTimeout(() => {
          status.textContent = '';
        }, 2000);
      }
    );
};

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
const restoreOptions = () => {
    chrome.storage.sync.get(
        { closeUponSaving: true },
        (items) => {
            document.getElementById('closeUponSaving').checked = items.closeUponSaving;
        }
    );
};
  
document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);
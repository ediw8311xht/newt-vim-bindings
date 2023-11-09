(function() {
    'use strict';

    let template = `
        <style>
            @import url('css/shared.css');

            a {
                color: var(--accent-color);
            }

            .card {
                display: flex;
                flex-direction: column;
                background-color: var(--background-color);
                margin: 10px auto;
                padding: 10px;
                vertical-align: top;
                box-shadow: 0px 2px 3px var(--shadow-color);
                border-radius: 5px;
                overflow: hidden;
                min-height: 375px;
                max-width: 800px;
                font-size: 14px;
            }

            .card-title {
                font-size: 22px;
                font-weight: 400;
                color: var(--accent-color);
                margin-bottom: 5px;
                overflow: ellipses;
                text-overflow: ellipses;
                white-space: nowrap;
            }

            .settings-row {
                padding: 10px 10px;
                border-bottom: 1px solid var(--divider-color);
            }

            .settings-row .main {
                display: flex;
                flex-direction: row;
            }

            .settings-row .label {
                flex: 1;
                font-size: 16px;
                line-height: 32px;
            }

            .settings-row i {
                margin-right: 10px;
                cursor: pointer;
                line-height: 32px;
            }

            .settings-row i:hover {
                color: var(--accent-color);
            }

            .settings-row .description {
                margin-top: 10px;
                display: none;
            }

            .button {
                color: var(--accent-color);
                padding: 8px 15px;
                float: right;
                font-size: 15px;
                cursor: pointer;
                text-align: center;
            }

            .button:hover {
                background-color: var(--highlight-color);
            }
        </style>
        <div class='card'>

            <div class='card-title'>Settings</div>
            <div class='settings-row'>
                <div class='main'>
                    <span class='label'>Theme</span>
                    <i id="iconDeleteTheme" class="material-icons md-24" title="Delete the currently selected theme">delete</i>
                    <i id="iconEditTheme" class="material-icons md-24" title="Edit the currently selected theme">edit</i>
                    <i id="iconAddTheme" class="material-icons md-24" title="Build a new theme">add</i>
                    <select id='prefTheme' name='selectedTheme'>

                    </select>

                </div>
                <div class='description' id='descTheme'>

                </div>
            </div>

            <div class='settings-row'>
                <div class='main'>
                    <span class='label'>Keyboard Shortcuts</span>
                    <i id="iconDeleteKey"   class="material-icons md-24" title="Delete the currently selected Keyboard Shortcuts.">delete</i>
                    <i id="iconEditKey"     class="material-icons md-24" title="Edit the currently selected Keyboard Shortcut.">edit</i>
                    <i id="iconAddKey"      class="material-icons md-24" title="Build new Keyboard Shortcuts.">add</i>
                    <select id='prefKey' name='selectedKey'>

                    </select>
                </div>
                <div class='description' id='descKey'>

                </div>
            </div>


            <p>
                Note: All Newt settings (preferences and custom themes) are now stored using Chrome's storage sync. That means that if you change something here, it'll be reflected on your other computer. This isn't instant and can take up to a minute to sync over. Newt initially stores the settings from the first computer used after the recent app update to migrate to Chrome storage. Since this may not be what you wanted, the settings in the old system were left intact. To migrate your old settings from a different PC, open up Newt on it and <a id="btnMigrate" href="#">click here</a>.
            </p>

            <span id="migrateSuccess" style="display:none; font-weight:bold;">Successfully migrated old settings from this PC!</span>
        </div>
    `;
    class SettingsCard extends HTMLElement {
        constructor() {
            super();

            this.attachShadow({mode: 'open'}).innerHTML = template;
            let qsels = ['.card', '#btnMigrate',
                '#prefTheme',  '#iconAddTheme', '#iconDeleteTheme', '#iconEditTheme', 
                '#prefKey', '#iconDeleteKey', '#iconEditKey',  '#iconAddKey'];
            for (let i = 0; i < qsels.length; i++) {
                console.log(qsels[i]);
                this['$' + qsels[i].slice(1)] = this.shadowRoot.querySelector(qsels[i]);
            }

            // Event listeners

            // THEME
            this.$prefTheme.addEventListener('change', this.prefChanged.bind(this));

            this.$iconAddTheme.addEventListener('click', () => {
                Newt.openThemeBuilder(false, this.$prefTheme.value);
            });

            this.$iconDeleteTheme.addEventListener('click', () => {
                if (this.$prefTheme.value.indexOf('customtheme') > -1) {
                    Newt.showConfirmPrompt('Are you sure you want to delete this theme?', 'deleteTheme', this.$prefTheme.value);
                }
            });

            this.$iconEditTheme.addEventListener('click', () => {
                Newt.openThemeBuilder(true, this.$prefTheme.value);
            });

            // KEYBOARD SHORTCUTS
            this.$prefKey.addEventListener('change', this.prefChanged.bind(this));

            this.$iconAddKey.addEventListener('click', () => {
                Newt.openThemeBuilder(false, this.$prefKey.value);
            });

            this.$iconDeleteKey.addEventListener('click', () => {
                if (this.$prefKey.value.indexOf('customkey') > -1) {
                    Newt.showConfirmPrompt('Are you sure you want to delete this key?', 'deleteKey', this.$prefKey.value);
                }
            });

            this.$iconEditKey.addEventListener('click', () => {
                Newt.openKeyBuilder(true, this.$prefKey.value);
            });


            // PROPOGATE THEMES
            let self = this;

            let allThemes = AppPrefs.baseThemes.concat(AppPrefs.customThemes);
            allThemes.forEach(function(theme) {
                let option = document.createElement('option');
                option.value = theme.id;
                option.innerText = theme.name;
                self.$prefTheme.appendChild(option);
            });

            this.$prefTheme.value = AppPrefs.selectedTheme;

            // PROPOGATE KEYS
            let allKeys = AppPrefs.baseKeys.concat(AppPrefs.customKeys);
            allKeys.forEach(function(key) {
                let option = document.createElement('option');
                option.value = key.id;
                option.innerText = key.name;
                self.$prefKey.appendChild(option);
            });

            this.$prefKey.value = AppPrefs.selectedKey;

            // OTHER

            this.$btnMigrate.addEventListener('click', () => {
                SettingsService.migrateToChromeStorage().then(() => {
                    this.shadowRoot.querySelector('#migrateSuccess').style.display = 'block';
                });
            });


            this.updateIcons();
        }

        prefChanged(ev) {
            let element = ev.target;

            Newt.updatePref(element.name, element.value);

            this.updateIcons();
        }

        updateIcons() {
            if (this.$prefTheme.value.includes('customtheme')) {
                this.$iconDeleteTheme.style.display = 'block';
                this.$iconEditTheme.style.display = 'block';
            } else {
                this.$iconDeleteTheme.style.display = 'none';
                this.$iconEditTheme.style.display = 'none';
            }
            if (this.$prefKey.value.includes('customkey')) {
                this.$iconDeleteTheme.style.display = 'block';
                this.$iconEditTheme.style.display = 'block';
            } else {
                this.$iconDeleteKey.style.display = 'none';
                this.$iconEditKey.style.display = 'none';
            }
        }

        refreshThemes() {
            while (this.$prefTheme.lastChild) {
                this.$prefTheme.removeChild(this.$prefTheme.lastChild);
            }

            let self = this;
            let allThemes = AppPrefs.baseThemes.concat(AppPrefs.customThemes);
            allThemes.forEach(function(theme) {
                let option = document.createElement('option');
                option.value = theme.id;
                option.innerText = theme.name;

                self.$prefTheme.appendChild(option);
            });

            this.$prefTheme.value = AppPrefs.selectedTheme;
            this.updateIcons();

            Newt.updatePref('selectedTheme', AppPrefs.selectedTheme);
        }

        refreshKeys() {
            while (this.$prefKey.lastChild) {
                this.$prefKey.removeChild(this.$prefKey.lastChild);
            }

            let self = this;
            let allKeys = AppPrefs.baseKeys.concat(AppPrefs.customKeys);
            allKeys.forEach(function(key) {
                let option = document.createElement('option');
                option.value = key.id;
                option.innerText = key.name;

                self.$prefKey.appendChild(option);
            });

            this.$prefKey.value = AppPrefs.selectedKey;
            this.updateIcons();

            Newt.updatePref('selectedKey', AppPrefs.selectedKey);
        }

    }

    customElements.define('settings-card', SettingsCard);
})();

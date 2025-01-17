// @flow

// Reach styles need to come before any component styles.
// This makes overridding the styles simpler.
import '@reach/menu-button/styles.css';
import '@reach/tooltip/styles.css';

import React, { useMemo, useState } from 'react';
import Bridge from 'src/bridge';
import Store from '../store';
import { BridgeContext, StoreContext } from './context';
import Components from './Components/Components';
import Profiler from './Profiler/Profiler';
import TabBar from './TabBar';
import { SettingsContextController } from './Settings/SettingsContext';
import { TreeContextController } from './Components/TreeContext';
import ViewElementSourceContext from './Components/ViewElementSourceContext';
import { ProfilerContextController } from './Profiler/ProfilerContext';
import { ModalDialogContextController } from './ModalDialog';
import ReactLogo from './ReactLogo';

import styles from './DevTools.css';

import './root.css';

import type { InspectedElement } from 'src/devtools/views/Components/types';

export type BrowserTheme = 'dark' | 'light';
export type TabID = 'components' | 'profiler' | 'settings';
export type ViewElementSource = (
  id: number,
  inspectedElement: InspectedElement
) => void;

export type Props = {|
  bridge: Bridge,
  browserTheme?: BrowserTheme,
  defaultTab?: TabID,
  showTabBar?: boolean,
  store: Store,
  viewElementSourceFunction?: ?ViewElementSource,
  viewElementSourceRequiresFileLocation?: boolean,

  // This property is used only by the web extension target.
  // The built-in tab UI is hidden in that case, in favor of the browser's own panel tabs.
  // This is done to save space within the app.
  // Because of this, the extension needs to be able to change which tab is active/rendered.
  overrideTab?: TabID,

  // To avoid potential multi-root trickiness, the web extension uses portals to render tabs.
  // The root <DevTools> app is rendered in the top-level extension window,
  // but individual tabs (e.g. Components, Profiling) can be rendered into portals within their browser panels.
  componentsPortalContainer?: Element,
  profilerPortalContainer?: Element,
  settingsPortalContainer?: Element,
|};

const componentsTab = {
  id: ('components': TabID),
  icon: 'components',
  label: 'Components',
  title: 'React Components',
};
const profilerTab = {
  id: ('profiler': TabID),
  icon: 'profiler',
  label: 'Profiler',
  title: 'React Profiler',
};

const tabs = [componentsTab, profilerTab];

export default function DevTools({
  bridge,
  browserTheme = 'light',
  defaultTab = 'components',
  componentsPortalContainer,
  overrideTab,
  profilerPortalContainer,
  settingsPortalContainer,
  showTabBar = false,
  store,
  viewElementSourceFunction,
  viewElementSourceRequiresFileLocation = false,
}: Props) {
  const [tab, setTab] = useState(defaultTab);
  if (overrideTab != null && overrideTab !== tab) {
    setTab(overrideTab);
  }

  const viewElementSource = useMemo(
    () => ({
      isFileLocationRequired: viewElementSourceRequiresFileLocation,
      viewElementSourceFunction: viewElementSourceFunction || null,
    }),
    [viewElementSourceFunction, viewElementSourceRequiresFileLocation]
  );

  return (
    <BridgeContext.Provider value={bridge}>
      <StoreContext.Provider value={store}>
        <ModalDialogContextController>
          <SettingsContextController
            browserTheme={browserTheme}
            componentsPortalContainer={componentsPortalContainer}
            profilerPortalContainer={profilerPortalContainer}
            settingsPortalContainer={settingsPortalContainer}
          >
            <ViewElementSourceContext.Provider value={viewElementSource}>
              <TreeContextController>
                <ProfilerContextController>
                  <div className={styles.DevTools}>
                    {showTabBar && (
                      <div className={styles.TabBar}>
                        <ReactLogo />
                        <span className={styles.DevToolsVersion}>
                          {process.env.DEVTOOLS_VERSION}
                        </span>
                        <div className={styles.Spacer} />
                        <TabBar
                          currentTab={tab}
                          id="DevTools"
                          selectTab={setTab}
                          size="large"
                          tabs={tabs}
                        />
                      </div>
                    )}
                    <div
                      className={styles.TabContent}
                      hidden={tab !== 'components'}
                    >
                      <Components portalContainer={componentsPortalContainer} />
                    </div>
                    <div
                      className={styles.TabContent}
                      hidden={tab !== 'profiler'}
                    >
                      <Profiler portalContainer={profilerPortalContainer} />
                    </div>
                  </div>
                </ProfilerContextController>
              </TreeContextController>
            </ViewElementSourceContext.Provider>
          </SettingsContextController>
        </ModalDialogContextController>
      </StoreContext.Provider>
    </BridgeContext.Provider>
  );
}

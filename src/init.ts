// Copyright 2024 Glen Reesor
//
// This file is part of HammerBar.
//
// HammerBar is free software: you can redistribute it and/or
// modify it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or (at your
// option) any later version.
//
// HammerBar is distributed in the hope that it will be useful, but
// WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
// FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more
// details.
//
// You should have received a copy of the GNU General Public License along with
// HammerBar. If not, see <https://www.gnu.org/licenses/>.

const VERSION = '0.9';

import { LauncherConfigType } from './types';
import { getScreenInfo } from './hammerspoonUtils';

import Panel from './Panel';
import type { WidgetBuildingInfo } from './Panel';
import { printDiagnostic } from './utils';
import { getAppLauncherBuilder } from './widgets/appLauncher';
import { getAppMenuBuilder } from './widgets/appMenu';
import { getClockBuilder } from './widgets/clock';
import { getDotGraphBuilder } from './widgets/dotGraph';
import { getLineGraphBuilder } from './widgets/lineGraph';
import { getTextBuilder } from './widgets/text';
import { getWindowListBuilder } from './widgets/windowList';
import { getXEyesBuilder } from './widgets/xeyes';

type ConfigV2 = {
  panelHeight: number;
};

const configV2: ConfigV2 = {
  panelHeight: 45,
};

interface ConfigType {
  fontSize: number;
  showClock: boolean;
  taskbarHeight: number;
  taskbarColor: hs.ColorType;
  launchers: LauncherConfigType[];
  bundleIdsRequiringFocusHack: string[];
}

const config:ConfigType = {
  fontSize: 13,
  showClock: false,
  taskbarHeight: 45,
  taskbarColor: { red: 220/255, green: 220/255, blue: 220/255 },
  launchers: [],
  bundleIdsRequiringFocusHack: [],
};

//-----------------------------------------------------------------------------

function verticallyMaximizeCurrentWindow() {
  const currentWindow = hs.window.focusedWindow();
  if (currentWindow) {
    const screenInfo = getScreenInfo(currentWindow.screen());
    currentWindow.setFrame({
      x: currentWindow.frame().x,
      y: screenInfo.y,
      w: currentWindow.frame().w,
      h: screenInfo.height - config.taskbarHeight,
    });
  }
}

//------------------------------------------------------------------------------
// Public Interface
//------------------------------------------------------------------------------

const panels: { destroy: () => void }[] = [];
const widgetsBuildingInfoLeft: WidgetBuildingInfo[] = [];
const widgetsBuildingInfoRight: WidgetBuildingInfo[] = [];

export function startV2() {
  printDiagnostic(`Version: ${VERSION}`);
  hs.hotkey.bind('command ctrl', 'up', verticallyMaximizeCurrentWindow);

  const errorFreeWidgetBuildersLeft: WidgetBuildingInfo[] = [];
  const errorFreeWidgetBuildersRight: WidgetBuildingInfo[] = [];

  widgetsBuildingInfoLeft.forEach((info) => {
    if (info.buildErrors.length === 0) {
      errorFreeWidgetBuildersLeft.push(info);
    } else {
      print('Error building widget:');
      info.buildErrors.forEach((txt) => print(`    ${txt}`));
    }
  });

  widgetsBuildingInfoRight.forEach((info) => {
    if (info.buildErrors.length === 0) {
      errorFreeWidgetBuildersRight.push(info);
    } else {
      print('Error building widget:');
      info.buildErrors.forEach((txt) => print(`    ${txt}`));
    }
  });

  hs.screen.allScreens().forEach((hammerspoonScreen) => {
    const screenInfo = getScreenInfo(hammerspoonScreen);
    printDiagnostic(`Adding panel for screen ${screenInfo.name} (id: ${screenInfo.id})`);

    panels.push(Panel({
      x: screenInfo.x,
      y: screenInfo.y + screenInfo.height - configV2.panelHeight,
      width: screenInfo.width,
      height: configV2.panelHeight,
      widgetsBuildingInfo: {
        left: errorFreeWidgetBuildersLeft,
        right: errorFreeWidgetBuildersRight,
      },
      windowListBuilder: getWindowListBuilder(screenInfo.id),
    }));
  });
}

export function addWidgetBuildersLeft(buildingInfo: WidgetBuildingInfo[]) {
  buildingInfo.forEach((b) => widgetsBuildingInfoLeft.push(b));
}

export function addWidgetBuildersRight(buildingInfo: WidgetBuildingInfo[]) {
  buildingInfo.forEach((b) => widgetsBuildingInfoRight.push(b));
}

export {
  getAppLauncherBuilder,
  getAppMenuBuilder,
  getClockBuilder,
  getDotGraphBuilder,
  getLineGraphBuilder,
  getTextBuilder,
  getXEyesBuilder,
}

export function stop() {
  // @TODO: Stop everything
}


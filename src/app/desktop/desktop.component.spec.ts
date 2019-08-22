import { async, ComponentFixture, inject, TestBed } from '@angular/core/testing';

import { DesktopComponent } from './desktop.component';
import { DesktopMenuComponent } from './desktop-menu/desktop-menu.component';
import { HttpClientModule } from '@angular/common/http';
import { RouterTestingModule } from '@angular/router/testing';
import { PXtoViewHeightPipe } from '../pxto-view-height.pipe';
import { PXtoViewWidthPipe } from '../pxto-view-width.pipe';
import { ContextMenuComponent } from './context-menu/context-menu.component';
import { DesktopStartmenuComponent } from './desktop-startmenu/desktop-startmenu.component';
import { FormsModule } from '@angular/forms';
import { WindowManagerComponent } from './window-manager/window-manager.component';
import { WindowFrameComponent } from './window/window-frame.component';
import { TestWindowComponent } from './windows/test-window/test-window.component';
import { TerminalComponent } from './windows/terminal/terminal.component';
import { WebsocketService } from '../websocket.service';
import { ProgramService } from './program.service';
import { of } from 'rxjs';
import { Program } from '../../dataclasses/program';
import { Position } from '../../dataclasses/position';
import { By } from '@angular/platform-browser';
import { WindowManagerService } from './window-manager/window-manager.service';
import { WindowDelegate } from './window/window-delegate';

describe('DesktopComponent', () => {
  let component: DesktopComponent;
  let fixture: ComponentFixture<DesktopComponent>;

  localStorage.setItem('token', '');
  localStorage.setItem('desktop', '');

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      providers: [
        WebsocketService,
        ProgramService
      ],
      imports: [
        HttpClientModule,
        FormsModule,
        RouterTestingModule
      ],
      declarations: [
        DesktopComponent,
        DesktopMenuComponent,
        PXtoViewWidthPipe,
        PXtoViewHeightPipe,
        ContextMenuComponent,
        DesktopStartmenuComponent,
        WindowManagerComponent,
        WindowFrameComponent,
        TestWindowComponent,
        TerminalComponent
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DesktopComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('#initSession() should get username, email, account creation time and last login time and save it to the session-storage',
    inject([WebsocketService], (webSocket: WebsocketService) => {
      const infoResponse = {
        name: 'somebody',
        mail: 'somebody@example.com',
        created: 0,
        last: 0
      };
      const requestSpy = spyOn(webSocket, 'request').and.returnValue(of(infoResponse));
      const setItemSpy = spyOn(sessionStorage, 'setItem');

      component.initSession();
      expect(requestSpy).toHaveBeenCalledWith({ action: 'info' });
      expect(setItemSpy).toHaveBeenCalledWith('username', infoResponse.name);
      expect(setItemSpy).toHaveBeenCalledWith('email', infoResponse.mail);
      expect(setItemSpy).toHaveBeenCalledWith('created', infoResponse.created);
      expect(setItemSpy).toHaveBeenCalledWith('last', infoResponse.last);
    }));

  it('#initSession() should save all devices to the session-storage', inject([WebsocketService], (webSocket: WebsocketService) => {
    spyOn(webSocket, 'request').and.returnValue(of({ name: '', mail: '', created: 0, last: 0 }));
    const firstDevice = {
      owner: '00000000-0000-0000-0000-000000000000',
      name: 'some device',
      power: 1,
      uuid: '00000000-0000-0000-0000-000000000000',
      powered_on: true
    };
    const secondDevice = Object.assign({}, firstDevice);
    secondDevice.name = 'another device';
    const msSpy = spyOn(webSocket, 'ms').and.returnValue(of({ devices: [firstDevice, secondDevice] }));
    const setItemSpy = spyOn(sessionStorage, 'setItem');

    component.initSession();
    expect(msSpy).toHaveBeenCalledWith('device', ['device', 'all'], {});
    expect(setItemSpy).toHaveBeenCalledWith('devices', JSON.stringify([firstDevice, secondDevice]));
    expect(setItemSpy).toHaveBeenCalledWith('activeDevice', JSON.stringify(firstDevice));
  }));

  it('#initSession() should create a device and save it to the session-storage if there is none',
    inject([WebsocketService], (webSocket: WebsocketService) => {
      const testDevice = {
        owner: '00000000-0000-0000-0000-000000000000',
        name: 'some device',
        power: 1,
        uuid: '00000000-0000-0000-0000-000000000000',
        powered_on: true
      };
      spyOn(webSocket, 'request').and.returnValue(of({ name: '', mail: '', created: 0, last: 0 }));
      const msSpy = spyOn(webSocket, 'ms').and.returnValues(of({ devices: [] }), of(testDevice));
      const setItemSpy = spyOn(sessionStorage, 'setItem');

      component.initSession();
      expect(msSpy).toHaveBeenCalledWith('device', ['device', 'all'], {});
      expect(msSpy).toHaveBeenCalledWith('device', ['device', 'starter_device'], {});
      expect(setItemSpy).toHaveBeenCalledWith('devices', JSON.stringify([testDevice]));
      expect(setItemSpy).toHaveBeenCalledWith('activeDevice', JSON.stringify(testDevice));
    }));

  it('#onDesktop() should return all desktop shortcuts which have the onDesktop property set to true', () => {
    component.linkages = [
      new Program('testProgram1', null, 'Test Program', '', true, new Position(0, 0, 0)),
      new Program('testProgram2', null, 'Test Program', '', false, new Position(0, 0, 0)),
      new Program('testProgram3', null, 'Test Program', '', true, new Position(0, 0, 0)),
      new Program('testProgram4', null, 'Test Program', '', true, new Position(0, 0, 0)),
      new Program('testProgram5', null, 'Test Program', '', false, new Position(0, 0, 0)),
    ];
    expect(component.onDesktop()).toEqual(component.linkages.filter(linkage => linkage.onDesktop));
  });

  it('#toggleStartMenu() should turn the start menu on if it was turned off', () => {
    component.startMenu = false;
    component.toggleStartMenu();
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('app-desktop-startmenu'))).toBeTruthy();
  });

  it('#toggleStartMenu() should turn the start menu off if it was turned on', () => {
    component.startMenu = true;
    component.toggleStartMenu();
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('app-desktop-startmenu'))).toBeFalsy();
  });

  it('#hideStartMenu() should turn the start menu off', () => {
    component.startMenu = false;
    component.hideStartMenu();
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('app-desktop-startmenu'))).toBeFalsy();
    component.startMenu = true;
    component.hideStartMenu();
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('app-desktop-startmenu'))).toBeFalsy();
  });

  it('should call #hideStartMenu() when you put your mouse down on the empty desktop surface', () => {
    const hideSpy = spyOn(component, 'hideStartMenu');
    component.surface.nativeElement.dispatchEvent(new Event('mousedown'));
    expect(hideSpy).toHaveBeenCalled();
  });

  it('#openProgramWindow() should open a window using the window manager',
    inject([WindowManagerService], (windowManager: WindowManagerService) => {
      const openWindowSpy = spyOn(windowManager, 'openWindow');
      const testProgram = new Program('testProgram', null, 'Test Program', '', true, new Position(0, 0, 0));
      const testDelegate = new class extends WindowDelegate {
        icon = '';
        title = 'This is a test window';
        type = null;
      };
      const newWindowSpy = spyOn(testProgram, 'newWindow').and.returnValue(testDelegate);

      component.openProgramWindow(testProgram);
      expect(newWindowSpy).toHaveBeenCalled();
      expect(openWindowSpy).toHaveBeenCalledWith(testDelegate);
    }));

  it('should call unfocus() from the window manager when you put your mouse down on the empty desktop surface',
    inject([WindowManagerService], (windowManager: WindowManagerService) => {
      const unfocusSpy = spyOn(windowManager, 'unfocus');
      component.surface.nativeElement.dispatchEvent(new Event('mousedown'));
      expect(unfocusSpy).toHaveBeenCalled();
    }));

  it('#checkWindowUnfocus() should not call unfocus() from the window manager ' +
    'when you put your mouse down on anything else but the desktop surface',
    inject([WindowManagerService], (windowManager: WindowManagerService) => {
      const unfocusSpy = spyOn(windowManager, 'unfocus');
      component.checkWindowUnfocus(new MouseEvent('mousedown'));
      expect(unfocusSpy).not.toHaveBeenCalled();
    }));

  it('should display a context menu when you right-click on the desktop surface, and should hide it when the cursor leaves it', () => {
    component.surface.nativeElement.dispatchEvent(new Event('contextmenu'));
    fixture.detectChanges();
    const contextMenu = fixture.debugElement.query(By.css('app-context-menu'));
    expect(contextMenu).toBeTruthy('Context menu was not displayed');
    if (contextMenu) {
      contextMenu.nativeElement.dispatchEvent(new Event('mouseleave'));
    }
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('app-context-menu'))).toBeFalsy('Context menu was not hidden');
  });

  it('should display programs from #onDesktop() as shortcuts', () => {
    const testPrograms = [
      new Program('testProgram', null, 'Test Program', '', true, new Position(0, 0, 0)),
      new Program('testProgram2', null, 'Test Program 2', '', true, new Position(0, 100, 0))
    ];
    const onDesktopSpy = spyOn(component, 'onDesktop').and.returnValue(testPrograms);
    fixture.detectChanges();
    expect(onDesktopSpy).toHaveBeenCalled();
    const linkageElements = fixture.debugElement.queryAll(By.css('.linkage'));
    expect(linkageElements.length).toEqual(2);
    // not perfect
  });

  it('should move the position of a shortcut, when drag-and-dropping it, to the drop position', () => {
    setAllowShortcutDropping(true);
    pretendSurfaceSize();
    const testProgram = new Program('testProgram', null, 'Test Program', '', true, new Position(0, 0, 0));
    component.linkages = [testProgram];
    fixture.detectChanges();
    const linkageElement: HTMLElement = fixture.debugElement.query(By.css('.linkage')).nativeElement;
    const testDropPos = { x: 54, y: 11 };
    simulateShortcutDrag(linkageElement, testDropPos);

    expect({ x: testProgram.position.x, y: testProgram.position.y })
      .toEqual(testDropPos, 'Shortcut was not dropped at the right position');
  });

  it('#checkDropAllowed() should only allow dragging a shortcut if the element under the dragging element is the desktop surface', () => {
    const elementsFromPointSpy = spyOn(document, 'elementsFromPoint').and.returnValue([null, component.surface.nativeElement]);
    const movePosition = { x: 246, y: 315 };

    expect(component.checkDropAllowed(new MouseEvent('mousemove', { clientX: movePosition.x, clientY: movePosition.y }))).toBeTruthy();
    expect(elementsFromPointSpy).toHaveBeenCalledWith(movePosition.x, movePosition.y);

    elementsFromPointSpy.and.returnValue([null]);
    expect(component.checkDropAllowed(new MouseEvent('mousemove', { clientX: movePosition.x, clientY: movePosition.y }))).toBeFalsy();
  });

  it('should not move a shortcut outside the bounds of the desktop surface area', () => {
    setAllowShortcutDropping(true);
    const surfaceSize = { width: 200, height: 600 };
    pretendSurfaceSize(surfaceSize.width, surfaceSize.height);
    const testProgram = new Program('testProgram', null, 'Test Program', '', true, new Position(0, 0, 0));
    component.linkages = [testProgram];
    fixture.detectChanges();
    const linkageElement: HTMLElement = fixture.debugElement.query(By.css('.linkage')).nativeElement;
    const testDropPos = { x: 451, y: -15 };
    simulateShortcutDrag(linkageElement, testDropPos);

    expect({ x: testProgram.position.x, y: testProgram.position.y })
      .toEqual({ x: surfaceSize.width - linkageElement.clientWidth, y: 0 }, 'Shortcut was not dropped at the right position');
  });

  it('should move a clone of the linkage along the mouse cursor when dragging', () => {
    pretendSurfaceSize();
    const startPosition = { x: 12, y: 25 };
    const endPosition = { x: 150, y: 64 };
    const testProgram = new Program('testProgram', null, 'Test Program', '', true, new Position(startPosition.x, startPosition.y, 0));
    component.linkages = [testProgram];
    fixture.detectChanges();
    const linkageElement: HTMLElement = fixture.debugElement.query(By.css('.linkage')).nativeElement;
    simulateShortcutDrag(linkageElement, endPosition, false);
    fixture.detectChanges();

    const linkageClone = component.dragElement;
    expect(linkageClone).toBeTruthy();
    const cloneBounds = linkageClone ? linkageClone.getBoundingClientRect() : {};
    expect({ x: cloneBounds['x'], y: cloneBounds['y'] }).toEqual(endPosition);
  });

  it('should not drop a shortcut if checkDropAllowed() returns false', () => {
    setAllowShortcutDropping(false);
    pretendSurfaceSize();
    const startPosition = { x: 78, y: 134 };
    const testProgram = new Program('testProgram', null, 'Test Program', '', true, new Position(startPosition.x, startPosition.y, 0));
    component.linkages = [testProgram];
    fixture.detectChanges();
    const linkageElement: HTMLElement = fixture.debugElement.query(By.css('.linkage')).nativeElement;

    simulateShortcutDrag(linkageElement, { x: 256, y: 37 });

    expect({ x: testProgram.position.x, y: testProgram.position.y }).toEqual(startPosition);
  });

  it('should add the class "not-allowed" to the linkage clone when checkDropAllowed() returns false', () => {
    setAllowShortcutDropping(false);
    const testProgram = new Program('testProgram', null, 'Test Program', '', true, new Position(0, 0, 0));
    component.linkages = [testProgram];
    fixture.detectChanges();
    const linkageElement: HTMLElement = fixture.debugElement.query(By.css('.linkage')).nativeElement;
    simulateShortcutDrag(linkageElement, { x: 15, y: 26 }, false);
    fixture.detectChanges();

    const linkageClone = component.dragElement;
    expect(linkageClone).toHaveClass('not-allowed');
  });

  it('should also release the dragged shortcut if it was not moved', () => {
    pretendSurfaceSize();
    const startPosition = { x: 25, y: 67 };
    const testProgram = new Program('testProgram', null, 'Test Program', '', true, new Position(startPosition.x, startPosition.y, 0));
    component.linkages = [testProgram];
    fixture.detectChanges();
    const linkageElement: HTMLElement = fixture.debugElement.query(By.css('.linkage')).nativeElement;

    linkageElement.dispatchEvent(new MouseEvent('mousedown'));
    document.dispatchEvent(new MouseEvent('mouseup'));

    expect({ x: testProgram.position.x, y: testProgram.position.y }).toEqual(startPosition);
    expect(component.dragLinkageIndex).toBeUndefined();
    expect(component.dragElement).toBeUndefined();
    expect(component.dragOffset).toBeUndefined();
  });

  it('should not do anything with a shortcut if you just move your mouse', () => {
    setAllowShortcutDropping(true);
    pretendSurfaceSize();
    const startPosition = { x: 21, y: 258 };
    const testProgram = new Program('testProgram', null, 'Test Program', '', true, new Position(startPosition.x, startPosition.y, 0));
    component.linkages = [testProgram];

    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 124, clientY: 56 }));
    document.dispatchEvent(new MouseEvent('mouseup', { clientX: 124, clientY: 56 }));
    expect({ x: testProgram.position.x, y: testProgram.position.y }).toEqual(startPosition);
  });

  it('#checkDropAllowed should use "msElementsFromPoint" if "elementsFromPoint" does not exist on document', () => {
    const elementsFromPoint = document.elementsFromPoint;
    const spy = document['msElementsFromPoint'] = jasmine.createSpy('msElementsFromPoint', document['msElementsFromPoint']);
    document.elementsFromPoint = undefined;
    component.checkDropAllowed(new MouseEvent('mousemove'));

    expect(spy).toHaveBeenCalled();

    document.elementsFromPoint = elementsFromPoint;
  });

  it('#checkDropAllowed should return true if neither "elementsFromPoint" nor "msElementsFromPoint" exists', () => {
    const elementsFromPoint = document.elementsFromPoint;
    const msElementsFromPoint = document['msElementsFromPoint'];
    document.elementsFromPoint = undefined;
    document['msElementsFromPoint'] = undefined;

    expect(component.checkDropAllowed(new MouseEvent('mousemove'))).toBeTruthy();

    document.elementsFromPoint = elementsFromPoint;
    document['msElementsFromPoint'] = msElementsFromPoint;
  });

  function setAllowShortcutDropping(allow: boolean): jasmine.Spy {
    return spyOn(component, 'checkDropAllowed').and.returnValue(allow);
  }

  function pretendSurfaceSize(width = 600, height = 400): jasmine.Spy {
    return spyOn(component.surface.nativeElement, 'getBoundingClientRect').and.returnValue(new DOMRect(0, 0, width, height));
  }

});


function simulateShortcutDrag(linkageElement: HTMLElement, dropPos: { x: number, y: number }, release = true) {
  const linkageBounds = linkageElement.getBoundingClientRect();
  linkageElement.dispatchEvent(new MouseEvent('mousedown', { clientX: linkageBounds.left, clientY: linkageBounds.top }));
  document.dispatchEvent(new MouseEvent('mousemove', { clientX: linkageBounds.left, clientY: linkageBounds.top }));
  document.dispatchEvent(new MouseEvent('mousemove', { clientX: dropPos.x, clientY: dropPos.y }));
  if (release) {
    document.dispatchEvent(new MouseEvent('mouseup', { clientX: dropPos.x, clientY: dropPos.y }));
  }
}

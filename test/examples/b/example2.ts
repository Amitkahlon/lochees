import { AppList, CategoryMenu, PeopleView } from '../../page-objects';
import { HubComp } from '../../page-objects/components/hub-comp';
import { EmptyState } from '../../page-objects/general/empty-state-comp';
import { SetupPage } from '../../page-objects/pages/setup-page';
import { Results } from '../../page-objects/search/results-comp';
import { ensureMenuOpen, MenuExpanderState } from '../../test-utils/general-test-utils/menu-utils';
import { usePageObject } from '../../test-utils/testim-service/use-page-object';
import {
  ensurePeopleMenuExpanded,
  ensurePreviewPopupIsClose,
  linkPeopleAndChoose,
  lowerCasePeople,
  navToPeopleWithWait,
  PascalCasePeople,
} from '../../test-utils/tests-specific-utils/people-tests-utills';

describe('Ui and empty State', () => {
  before(() => {
    // cy.skipIntro({ forceNewLogin: false });
    cy.skipWithUnleash({ admin: true });

    cy.unlinkAllApps();
  });

  describe('Ui', function () {
    beforeEach('skip to main page', function () {
      // cy.skipIntro();
      cy.skipWithUnleash({ admin: true });

      ensurePreviewPopupIsClose();
      ensureMenuOpen();
    });

    it('should have valid menu item', function () {
      cy.getFrom(CategoryMenu, (p) => p.getContainer(PascalCasePeople)).should('be.visible');
      cy.getFrom(CategoryMenu, (p) => p.getText(PascalCasePeople)).should('be.visible');
      cy.getFrom(CategoryMenu, (p) => p.getIcon(PascalCasePeople)).should('be.visible');

      cy.getFrom(CategoryMenu, (p) => p.getIcon(PascalCasePeople)).should('be.visible');
    });

    it('should be 6th in the menu', function () {
      cy.getFrom(CategoryMenu, (p) => p.getAllContainers())
        .as('containers')
        .should('have.length', 7);
      cy.get('@containers').eq(4).find('span').should('have.text', PascalCasePeople);
    });
    const site = 'Site';
    const department = 'Department';

    // -Skip: Deprecated
    // Notes: was removed in rc 1.21 (I think)
    it.skip('should have intercom launcher', () => {
      cy.navigateByUrl('/people');

      cy.getFrom(HubComp, (p) => p.intercomLauncher).should('be.visible');
    });

    it('should become pointer on hover', function () {
      cy.getFrom(CategoryMenu, (p) => p.getContainer(PascalCasePeople)).should('have.css', 'cursor', 'pointer');
    });

    it('should route to people view when clicking', function () {
      cy.getFrom(CategoryMenu, (p) => p.getContainer(PascalCasePeople))
        .click()
        .wait(1500);

      cy.url().should('include', `/people`);
    });

    describe('tests that need links', () => {
      before(() => {
        linkPeopleAndChoose();

        cy.wait(1000);
      });

      //TODO: Add bug
      // -Skip: WIP
      it.skip('should navigate by url', function () {
        cy.visit(usePageObject(PeopleView).route);

        cy.url().should('include', `/people`);

        cy.getFrom(PeopleView, (p) => p.preview.container).should('be.visible');
      });

      it('should open preview when going to people', function () {
        navToPeopleWithWait();

        cy.getFrom(CategoryMenu, (p) => p.getContainer(PascalCasePeople))
          .click()
          .wait(1500);
        cy.getFrom(PeopleView, (p) => p.preview.container).should('be.visible');
      });

      //TODO: Why this is skipped
      it.skip('should route to people nodes by clicking', () => {
        ensurePeopleMenuExpanded(MenuExpanderState.expanded);

        [
          ' Rishon LeZion, Israel',
          'Aden, Yemen',
          "Be'er Sheva, Israel",
          'Morocco',
          'Rehovot, Israel',
          'Tiberias, Israel',
          'Tikva Neigberhood, Tel-Aviv, Israel',
        ].forEach((location, i) => {
          cy.get('[data-cy^="menu-item-text"][parent-id="people/location"]').eq(i).click();
          const expectedUrl = location.replaceAll(' ', '-').toLowerCase();

          cy.url().should('include', '/people/location/' + expectedUrl);
        });

        cy.get('[data-cy^="menu-item-text"][parent-id="people/department"]').click();

        cy.url().should('include', '/people/department/ethnic');
      });

      // -Skip: Deprecated
      it.skip('should expand when clicking on the people menu item', function () {
        //before expand
        cy.getFrom(CategoryMenu, (p) => p.menuChild.container(site, lowerCasePeople)).should('not.exist');
        cy.getFrom(CategoryMenu, (p) => p.menuChild.text(site, lowerCasePeople)).should('not.exist');

        cy.getFrom(CategoryMenu, (p) => p.menuChild.container(department, lowerCasePeople)).should('not.exist');
        cy.getFrom(CategoryMenu, (p) => p.menuChild.text(department, lowerCasePeople)).should('not.exist');

        //expand
        cy.getFrom(CategoryMenu, (p) => p.getExpander(PascalCasePeople)).click();

        //after expand
        cy.getFrom(CategoryMenu, (p) => p.menuChild.container(site, lowerCasePeople)).should('be.visible');
        cy.getFrom(CategoryMenu, (p) => p.menuChild.text(site, lowerCasePeople)).should('be.visible');

        cy.getFrom(CategoryMenu, (p) => p.menuChild.container(department, lowerCasePeople)).should('be.visible');
        cy.getFrom(CategoryMenu, (p) => p.menuChild.text(department, lowerCasePeople)).should('be.visible');

        //un-expand
        cy.getFrom(CategoryMenu, (p) => p.getExpander(PascalCasePeople)).click();

        cy.getFrom(CategoryMenu, (p) => p.menuChild.container(site, lowerCasePeople)).should('not.exist');
        cy.getFrom(CategoryMenu, (p) => p.menuChild.text(site, lowerCasePeople)).should('not.exist');

        cy.getFrom(CategoryMenu, (p) => p.menuChild.container(department, lowerCasePeople)).should('not.exist');
        cy.getFrom(CategoryMenu, (p) => p.menuChild.text(department, lowerCasePeople)).should('not.exist');
      });

      //TODO: why this is skipped
      it.skip('should have valid filters', () => {
        ensurePeopleMenuExpanded(MenuExpanderState.expanded);

        [
          ' Rishon LeZion, Israel',
          'Aden, Yemen',
          "Be'er Sheva, Israel",
          'Morocco',
          'Rehovot, Israel',
          'Tiberias, Israel',
          'Tikva Neigberhood, Tel-Aviv, Israel',
        ].forEach((location) => {
          cy.getFrom(CategoryMenu, (p) => p.menuChild.text(location, 'people/location')).should('have.text', location);
        });

        ['Ethnic'].forEach((department) => {
          cy.getFrom(CategoryMenu, (p) => p.menuChild.text(department, 'people/department')).should('have.text', department);
        });
      });
    });
  });

  describe('Empty state', function () {
    before(() => {
      cy.skipWithUnleash({ admin: true });

      cy.unlinkAllApps();
    });

    beforeEach('skip to main page', function () {
      ensurePreviewPopupIsClose();

      // -Plaster
      // Notes: Without this there is a bug
      cy.wait(1500);
      cy.visit('/');
      cy.waitForApp();

      cy.navigateByUrl('/people');
    });

    // -Skip: Bug
    // Issue: https://github.com/chaseappio/ruta-40/issues/4940
    it.skip('should suggest apps to connect', function () {
      cy.getFrom(AppList, (p) => p.appList).as('appList');
      cy.getFrom(AppList, (p) => p.appList).should('be.visible');

      cy.get('app-list-item').should('have.length', 5);

      const icon = usePageObject(AppList).appIcon;
      const title = usePageObject(AppList).appTitle;
      const subTitle = usePageObject(AppList).appSubtitle;
      const allApps = usePageObject(AppList).allAppsItems;
      const connect = 'Connect now';

      cy.get('@appList').find(allApps).eq(0).find(icon).should('be.visible');
      cy.get('@appList').find(allApps).eq(0).find(title).should('be.visible').should('contain.text', 'Azure Active Directory');
      cy.get('@appList').find(allApps).eq(0).find(subTitle).should('be.visible').should('contain.text', connect);

      cy.get('@appList').find(allApps).eq(1).find(icon).should('be.visible');
      cy.get('@appList').find(allApps).eq(1).find(title).should('be.visible').should('contain.text', 'BambooHR');
      cy.get('@appList').find(allApps).eq(1).find(subTitle).should('be.visible').should('contain.text', connect);

      cy.get('@appList').find(allApps).eq(2).find(icon).should('be.visible');
      cy.get('@appList').find(allApps).eq(2).find(title).should('be.visible').should('contain.text', 'Google People Directory');
      cy.get('@appList').find(allApps).eq(2).find(subTitle).should('be.visible').should('contain.text', connect);

      cy.get('@appList').find(allApps).eq(3).find(icon).should('be.visible');
      cy.get('@appList').find(allApps).eq(3).find(title).should('be.visible').should('contain.text', 'HiBob');
      cy.get('@appList').find(allApps).eq(3).find(subTitle).should('be.visible').should('contain.text', connect);
    });

    it.only('should show correct right side text and image', () => {
      cy.getFrom(EmptyState, (p) => p.rightSideText).should('have.text', ' Select the HRIS connection to use in this page. ');
      cy.get('h1.step[step="1"]').should("have.text", "Connect your company's HRIS tool")
      
      cy.getFrom(EmptyState, (p) => p.rightSideImage)
        .should('be.visible')
        .imageIsNotDisable();
    });

    // -Skip: Broken
    // Notes: sometimes it reaches the 'suggested apps' instead of 'no result'
    it.skip('should show no results before sync ends', () => {
      cy.linkApps((b) => b.mockapp({ waitForSync: true }));

      navToPeopleWithWait();

      cy.getFrom(Results, (p) => p.resultWrapper).should('have.text', ' No results  ');
    });

    // -Skip: Bug
    // Issue: https://github.com/chaseappio/ruta-40/issues/4940
    it.skip('should connect app', { retries: 0 }, function () {
      cy.getFrom(AppList, (p) => p.getAppItem('mockapp')).click();

      cy.usePageObject(SetupPage, (p) => {
        cy.enter(p.linkAppIframe).then((body) => {
          //this is only to verify that that clicking on the app opens the iframe
          //we dont want to test the mocking linking integration because we dont care about it
          //and we have an infrastructure for linking mockapp...
          body().find('[id="keyInput"]').should('be.visible');
          body().find('[id="nameInput"]').should('be.visible');
        });
      });

      linkPeopleAndChoose();

      // -Plaster
      // Notes: without this wait there is a bug!
      cy.wait(5000);
      navToPeopleWithWait();

      cy.get('.preview-header-name').should('contain.text', 'Agam Buhbut');
    });
  });
});

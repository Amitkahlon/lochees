import { Key } from '../../commands/keypress';
import { PeopleView, SearchBar } from '../../page-objects';
import { Filters } from '../../page-objects/search/filters-comp';
import {
  ensurePreview,
  ensurePreviewPopupIsClose,
  linkPeopleAndChoose,
  navToPeopleWithWait,
  previewState,
} from '../../test-utils/tests-specific-utils/people-tests-utills';
import { disableOpen } from '../../test-utils/window-utils/window-utils';

describe('navigation', { browser: 'chrome', scrollBehavior: false }, () => {
  before(() => {
    // cy.skipIntro({ forceNewLogin: false });
    cy.skipWithUnleash({ admin: true });

    linkPeopleAndChoose();
  });

  beforeEach(() => {
    disableOpen();
  });

  beforeEach('ensure on people page', () => {
    // cy.skipIntro({ forceNewLogin: false });
    cy.skipWithUnleash({ admin: true });

    navToPeopleWithWait();
    cy.getFrom(Filters, (p) => p.container).should('be.visible');

    cy.getFrom(SearchBar, (p) => p.input).click({ force: true }); //this is to reset the state
  });

  /**
   * assert nav worked depends on preview state
   */
  const assertNav = (state: previewState, selectedTitle: string) => {
    if (state === previewState.open) {
      cy.getFrom(PeopleView, (p) => p.preview.title).should('have.text', selectedTitle);
    } else {
      cy.get('body').type('{enter}');
      cy.getFrom(PeopleView, (p) => p.preview.title).should('have.text', selectedTitle);
      cy.get('.people-preview-popup-close-popup > u-icon > .font-icon').click();
    }
  };

  /**
   * common navigation tests
   */
  const navigationTests = (withPreview: previewState) => {
    const callNavAssert = (selectedTitle: string) => {
      assertNav(withPreview, selectedTitle);
    };

    it('mouse', () => {
      cy.getFrom(PeopleView, (p) => p.peopleItem.title)
        .eq(6)
        .click();

      callNavAssert('Margol');
    });

    // -Skip: Bug
    // Issue: https://github.com/chaseappio/ruta-40/issues/4939
    it.skip('should select first and last on pressing pageup/down', () => {
      // -Plaster
      // Notes: we reload to fix bug that lifts the view weirdly
      //TODO: Can I remove this?

      cy.reload();
      navToPeopleWithWait();
      ensurePreview(previewState.collapsed);

      cy.keyPress(Key.pageDown);

      callNavAssert('Moshe Peretz');

      cy.keyPress(Key.pageUp);

      callNavAssert('Agam Buhbut');
    });

    it('should move on arrow press', () => {
      cy.getFrom(PeopleView, (p) => p.peopleItem.title)
        .eq(1)
        .realClick();

      ensurePreviewPopupIsClose();

      cy.getFrom(PeopleView, (p) => p.peopleItem.title)
        .eq(0)
        .realClick();

      ensurePreviewPopupIsClose();

      callNavAssert('Agam Buhbut');

      cy.keyPress(Key.down);

      callNavAssert('Avihu Medina');

      cy.keyPress(Key.down);

      callNavAssert('Dudu Aharon');

      cy.keyPress(Key.up);
      cy.keyPress(Key.up);

      callNavAssert('Agam Buhbut');
    });
  };

  describe('with preview', () => {
    beforeEach('ensure preview open', () => {
      ensurePreviewPopupIsClose();
      ensurePreview(previewState.open);
      cy.getFrom(PeopleView, (p) => p.peopleItem.item)
        .eq(0)
        .click({ force: true });

      ensurePreviewPopupIsClose();
    });

    navigationTests(previewState.open);
  });

  describe('without preview', () => {
    beforeEach('ensure preview collapsed', () => {
      ensurePreviewPopupIsClose();
      ensurePreview(previewState.collapsed);
      cy.getFrom(PeopleView, (p) => p.peopleItem.item)
        .eq(0)
        .click({ force: true });
      ensurePreviewPopupIsClose();
    });

    navigationTests(previewState.collapsed);
  });
});

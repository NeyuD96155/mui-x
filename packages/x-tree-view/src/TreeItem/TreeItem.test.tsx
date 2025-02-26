import * as React from 'react';
import { expect } from 'chai';
import PropTypes from 'prop-types';
import { spy } from 'sinon';
import {
  describeConformance,
  act,
  createEvent,
  createRenderer,
  fireEvent,
  screen,
} from '@mui-internal/test-utils';
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeItem, treeItemClasses as classes } from '@mui/x-tree-view/TreeItem';
import { TreeViewContextValue } from '@mui/x-tree-view/internals/TreeViewProvider';
import { TreeViewContext } from '@mui/x-tree-view/internals/TreeViewProvider/TreeViewContext';
import { DefaultTreeViewPlugins } from '@mui/x-tree-view/internals';

const TEST_TREE_VIEW_CONTEXT_VALUE: TreeViewContextValue<DefaultTreeViewPlugins> = {
  instance: {
    isNodeExpandable: () => false,
    isNodeExpanded: () => false,
    isNodeFocused: () => false,
    isNodeSelected: () => false,
    isNodeDisabled: () => false,
    getTreeItemId: () => '',
    mapFirstCharFromJSX: () => {},
  } as any,
  runItemPlugins: ({ props, ref }) => ({ props, ref, wrapItem: (children) => children }),
  disabledItemsFocusable: false,
  icons: {
    slots: {},
    slotProps: {},
  },
  selection: {
    multiSelect: false,
  },
};

describe('<TreeItem />', () => {
  const { render } = createRenderer();

  describeConformance(<TreeItem nodeId="one" label="one" />, () => ({
    classes,
    inheritComponent: 'li',
    wrapMount: (mount) => (node: React.ReactNode) => {
      const wrapper = mount(
        <TreeViewContext.Provider value={TEST_TREE_VIEW_CONTEXT_VALUE}>
          {node}
        </TreeViewContext.Provider>,
      );
      return wrapper.childAt(0);
    },
    render: (node) => {
      return render(
        <TreeViewContext.Provider value={TEST_TREE_VIEW_CONTEXT_VALUE}>
          {node}
        </TreeViewContext.Provider>,
      );
    },
    muiName: 'MuiTreeItem',
    refInstanceof: window.HTMLLIElement,
    skip: ['reactTestRenderer', 'componentProp', 'componentsProp', 'themeVariants'],
  }));

  describe('warnings', () => {
    beforeEach(() => {
      PropTypes.resetWarningCache();
    });

    it('should warn if an onFocus callback is supplied', () => {
      expect(() => {
        PropTypes.checkPropTypes(
          TreeItem.propTypes,
          { nodeId: 'one', onFocus: () => {} },
          'prop',
          'TreeItem',
        );
      }).toErrorDev('Failed prop type: The prop `onFocus` is not supported.');
    });

    it('should warn if an `ContentComponent` that does not hold a ref is used', () => {
      expect(() => {
        PropTypes.checkPropTypes(
          TreeItem.propTypes,
          { nodeId: 'one', ContentComponent: () => {} },
          'prop',
          'TreeItem',
        );
      }).toErrorDev('Expected an element type that can hold a ref.');
    });
  });

  it('should call onClick when clicked', () => {
    const handleClick = spy();

    const { getByText } = render(
      <SimpleTreeView>
        <TreeItem nodeId="test" label="test" onClick={handleClick} />
      </SimpleTreeView>,
    );

    fireEvent.click(getByText('test'));

    expect(handleClick.callCount).to.equal(1);
  });

  it('should display the right icons', () => {
    const { getByTestId } = render(
      <SimpleTreeView
        slots={{
          expandIcon: () => <div data-test="defaultExpandIcon" />,
          collapseIcon: () => <div data-test="defaultCollapseIcon" />,
          endIcon: () => <div data-test="defaultEndIcon" />,
        }}
        defaultExpandedNodes={['1']}
      >
        <TreeItem nodeId="1" label="1" data-testid="1">
          <TreeItem nodeId="2" label="2" data-testid="2" />
          <TreeItem
            nodeId="5"
            label="5"
            data-testid="5"
            slots={{ icon: () => <div data-test="icon" /> }}
          />
          <TreeItem
            nodeId="6"
            label="6"
            data-testid="6"
            slots={{ endIcon: () => <div data-test="endIcon" /> }}
          />
        </TreeItem>
        <TreeItem nodeId="3" label="3" data-testid="3">
          <TreeItem nodeId="4" label="4" data-testid="4" />
        </TreeItem>
      </SimpleTreeView>,
    );

    const getIcon = (testId) => getByTestId(testId).querySelector(`.${classes.iconContainer} div`);

    expect(getIcon('1')).attribute('data-test').to.equal('defaultCollapseIcon');
    expect(getIcon('2')).attribute('data-test').to.equal('defaultEndIcon');
    expect(getIcon('3')).attribute('data-test').to.equal('defaultExpandIcon');
    expect(getIcon('5')).attribute('data-test').to.equal('icon');
    expect(getIcon('6')).attribute('data-test').to.equal('endIcon');
  });

  it('should allow conditional child', () => {
    function TestComponent() {
      const [hide, setState] = React.useState(false);

      return (
        <React.Fragment>
          <button data-testid="button" type="button" onClick={() => setState(true)}>
            Hide
          </button>
          <SimpleTreeView defaultExpandedNodes={['1']}>
            <TreeItem nodeId="1" data-testid="1">
              {!hide && <TreeItem nodeId="2" data-testid="2" />}
            </TreeItem>
          </SimpleTreeView>
        </React.Fragment>
      );
    }
    const { getByTestId, queryByTestId } = render(<TestComponent />);

    expect(getByTestId('1')).to.have.attribute('aria-expanded', 'true');
    expect(getByTestId('2')).not.to.equal(null);
    fireEvent.click(getByTestId('button'));
    expect(getByTestId('1')).not.to.have.attribute('aria-expanded');
    expect(queryByTestId('2')).to.equal(null);
  });

  it('should treat an empty array equally to no children', () => {
    const { getByTestId } = render(
      <SimpleTreeView defaultExpandedNodes={['1']}>
        <TreeItem nodeId="1" label="1" data-testid="1">
          <TreeItem nodeId="2" label="2" data-testid="2">
            {[]}
          </TreeItem>
        </TreeItem>
      </SimpleTreeView>,
    );

    expect(getByTestId('2')).not.to.have.attribute('aria-expanded');
  });
  it('should treat multiple empty conditional arrays as empty', () => {
    const { getByTestId } = render(
      <SimpleTreeView defaultExpandedNodes={['1']}>
        <TreeItem nodeId="1" label="1" data-testid="1">
          <TreeItem nodeId="2" label="2" data-testid="2">
            {[].map((_, index) => (
              <React.Fragment key={index}>a child</React.Fragment>
            ))}
            {[].map((_, index) => (
              <React.Fragment key={index}>a child</React.Fragment>
            ))}
          </TreeItem>
        </TreeItem>
      </SimpleTreeView>,
    );

    expect(getByTestId('2')).not.to.have.attribute('aria-expanded');
  });
  it('should treat one conditional empty and one conditional with results as expandable', () => {
    const { getByTestId } = render(
      <SimpleTreeView defaultExpandedNodes={['1', '2']}>
        <TreeItem nodeId="1" label="1" data-testid="1">
          <TreeItem nodeId="2" label="2" data-testid="2">
            {[]}
            {[1].map((_, index) => (
              <React.Fragment key={index}>a child</React.Fragment>
            ))}
          </TreeItem>
        </TreeItem>
      </SimpleTreeView>,
    );

    expect(getByTestId('2')).to.have.attribute('aria-expanded', 'true');
  });
  it('should handle edge case of nested array of array', () => {
    const { getByTestId } = render(
      <SimpleTreeView defaultExpandedNodes={['1', '2']}>
        <TreeItem nodeId="1" label="1" data-testid="1">
          <TreeItem nodeId="2" label="2" data-testid="2">
            {[[]]}
          </TreeItem>
        </TreeItem>
      </SimpleTreeView>,
    );

    expect(getByTestId('2')).not.to.have.attribute('aria-expanded');
  });

  it('should not call onClick when children are clicked', () => {
    const handleClick = spy();

    const { getByText } = render(
      <SimpleTreeView defaultExpandedNodes={['one']}>
        <TreeItem nodeId="one" label="one" onClick={handleClick}>
          <TreeItem nodeId="two" label="two" />
        </TreeItem>
      </SimpleTreeView>,
    );

    fireEvent.click(getByText('two'));

    expect(handleClick.callCount).to.equal(0);
  });

  it('should be able to use a custom id', () => {
    const { getByRole } = render(
      <SimpleTreeView>
        <TreeItem id="customId" nodeId="test" label="test" data-testid="test" />
      </SimpleTreeView>,
    );

    act(() => {
      getByRole('tree').focus();
    });

    expect(getByRole('tree')).to.have.attribute('aria-activedescendant', 'customId');
  });

  describe('Accessibility', () => {
    it('should have the role `treeitem`', () => {
      const { getByTestId } = render(
        <SimpleTreeView>
          <TreeItem nodeId="test" label="test" data-testid="test" />
        </SimpleTreeView>,
      );

      expect(getByTestId('test')).to.have.attribute('role', 'treeitem');
    });

    it('should add the role `group` to a component containing children', () => {
      const { getByRole, getByText } = render(
        <SimpleTreeView defaultExpandedNodes={['test']}>
          <TreeItem nodeId="test" label="test">
            <TreeItem nodeId="test2" label="test2" />
          </TreeItem>
        </SimpleTreeView>,
      );

      expect(getByRole('group')).to.contain(getByText('test2'));
    });

    describe('aria-expanded', () => {
      it('should have the attribute `aria-expanded=false` if collapsed', () => {
        const { getByTestId } = render(
          <SimpleTreeView>
            <TreeItem nodeId="test" label="test" data-testid="test">
              <TreeItem nodeId="test2" label="test2" />
            </TreeItem>
          </SimpleTreeView>,
        );

        expect(getByTestId('test')).to.have.attribute('aria-expanded', 'false');
      });

      it('should have the attribute `aria-expanded={true}` if expanded', () => {
        const { getByTestId } = render(
          <SimpleTreeView defaultExpandedNodes={['test']}>
            <TreeItem nodeId="test" label="test" data-testid="test">
              <TreeItem nodeId="test2" label="test2" />
            </TreeItem>
          </SimpleTreeView>,
        );

        expect(getByTestId('test')).to.have.attribute('aria-expanded', 'true');
      });

      it('should not have the attribute `aria-expanded` if no children are present', () => {
        const { getByTestId } = render(
          <SimpleTreeView>
            <TreeItem nodeId="test" label="test" data-testid="test" />
          </SimpleTreeView>,
        );

        expect(getByTestId('test')).not.to.have.attribute('aria-expanded');
      });
    });

    describe('aria-disabled', () => {
      it('should not have the attribute `aria-disabled` if disabled is false', () => {
        const { getByTestId } = render(
          <SimpleTreeView>
            <TreeItem nodeId="one" label="one" data-testid="one" />
          </SimpleTreeView>,
        );

        expect(getByTestId('one')).not.to.have.attribute('aria-disabled');
      });

      it('should have the attribute `aria-disabled={true}` if disabled', () => {
        const { getByTestId } = render(
          <SimpleTreeView>
            <TreeItem nodeId="one" label="one" disabled data-testid="one" />
          </SimpleTreeView>,
        );

        expect(getByTestId('one')).to.have.attribute('aria-disabled', 'true');
      });
    });

    describe('aria-selected', () => {
      describe('single-select', () => {
        it('should not have the attribute `aria-selected` if not selected', () => {
          const { getByTestId } = render(
            <SimpleTreeView>
              <TreeItem nodeId="test" label="test" data-testid="test" />
            </SimpleTreeView>,
          );

          expect(getByTestId('test')).not.to.have.attribute('aria-selected');
        });

        it('should have the attribute `aria-selected={true}` if selected', () => {
          const { getByTestId } = render(
            <SimpleTreeView defaultSelectedNodes={'test'}>
              <TreeItem nodeId="test" label="test" data-testid="test" />
            </SimpleTreeView>,
          );

          expect(getByTestId('test')).to.have.attribute('aria-selected', 'true');
        });
      });

      describe('multi-select', () => {
        it('should have the attribute `aria-selected=false` if not selected', () => {
          const { getByTestId } = render(
            <SimpleTreeView multiSelect>
              <TreeItem nodeId="test" label="test" data-testid="test" />
            </SimpleTreeView>,
          );

          expect(getByTestId('test')).to.have.attribute('aria-selected', 'false');
        });

        it('should have the attribute `aria-selected={true}` if selected', () => {
          const { getByTestId } = render(
            <SimpleTreeView multiSelect defaultSelectedNodes={['test']}>
              <TreeItem nodeId="test" label="test" data-testid="test" />
            </SimpleTreeView>,
          );

          expect(getByTestId('test')).to.have.attribute('aria-selected', 'true');
        });

        it('should have the attribute `aria-selected` if disableSelection is true', () => {
          const { getByTestId } = render(
            <SimpleTreeView multiSelect disableSelection>
              <TreeItem nodeId="test" label="test" data-testid="test" />
            </SimpleTreeView>,
          );

          expect(getByTestId('test')).to.have.attribute('aria-selected', 'false');
        });
      });
    });

    describe('when a tree receives focus', () => {
      it('should focus the first node if none of the nodes are selected before the tree receives focus', () => {
        const { getByRole, getByTestId, queryAllByRole } = render(
          <SimpleTreeView id="tree">
            <TreeItem nodeId="1" label="one" data-testid="one" />
            <TreeItem nodeId="2" label="two" />
            <TreeItem nodeId="3" label="three" />
          </SimpleTreeView>,
        );

        expect(queryAllByRole('treeitem', { selected: true })).to.have.length(0);

        act(() => {
          getByRole('tree').focus();
        });

        expect(getByTestId('one')).toHaveVirtualFocus();
      });

      it('should focus the selected node if a node is selected before the tree receives focus', () => {
        const { getByTestId, getByRole } = render(
          <SimpleTreeView selectedNodes="2" id="tree">
            <TreeItem nodeId="1" label="one" data-testid="one" />
            <TreeItem nodeId="2" label="two" data-testid="two" />
            <TreeItem nodeId="3" label="three" />
          </SimpleTreeView>,
        );

        expect(getByTestId('two')).to.have.attribute('aria-selected', 'true');

        act(() => {
          getByRole('tree').focus();
        });

        expect(getByTestId('two')).toHaveVirtualFocus();
      });

      it('should work with programmatic focus', () => {
        const { getByRole, getByTestId } = render(
          <SimpleTreeView>
            <TreeItem nodeId="1" label="one" data-testid="one" />
            <TreeItem nodeId="2" label="two" data-testid="two" />
          </SimpleTreeView>,
        );

        act(() => {
          getByRole('tree').focus();
        });

        expect(getByTestId('one')).toHaveVirtualFocus();

        act(() => {
          getByTestId('two').focus();
        });
        expect(getByTestId('two')).toHaveVirtualFocus();
      });

      it('should work when focused node is removed', () => {
        let removeActiveItem;
        // a TreeItem which can remove from the tree by calling `removeActiveItem`
        function ControlledTreeItem(props) {
          const [mounted, setMounted] = React.useReducer(() => false, true);
          removeActiveItem = setMounted;

          if (!mounted) {
            return null;
          }
          return <TreeItem {...props} />;
        }

        const { getByRole, getByTestId, getByText } = render(
          <SimpleTreeView defaultExpandedNodes={['parent']}>
            <TreeItem nodeId="parent" label="parent" data-testid="parent">
              <TreeItem nodeId="1" label="one" data-testid="one" />
              <ControlledTreeItem nodeId="2" label="two" data-testid="two" />
            </TreeItem>
          </SimpleTreeView>,
        );
        const tree = getByRole('tree');

        act(() => {
          tree.focus();
        });

        expect(getByTestId('parent')).toHaveVirtualFocus();

        fireEvent.click(getByText('two'));

        expect(getByTestId('two')).toHaveVirtualFocus();

        // generic action that removes an item.
        // Could be promise based, or timeout, or another user interaction
        act(() => {
          removeActiveItem();
        });

        expect(getByTestId('parent')).toHaveVirtualFocus();
      });

      it('should focus on tree with scroll prevented', () => {
        const { getByRole, getByTestId } = render(
          <SimpleTreeView>
            <TreeItem nodeId="1" label="one" data-testid="one" />
            <TreeItem nodeId="2" label="two" data-testid="two" />
          </SimpleTreeView>,
        );
        const focus = spy(getByRole('tree'), 'focus');

        act(() => {
          getByTestId('one').focus();
        });

        expect(focus.calledOnceWithExactly({ preventScroll: true })).to.equals(true);
      });
    });

    describe('Navigation', () => {
      describe('right arrow interaction', () => {
        it('should open the node and not move the focus if focus is on a closed node', () => {
          const { getByRole, getByTestId } = render(
            <SimpleTreeView id="tree">
              <TreeItem nodeId="one" label="one" data-testid="one">
                <TreeItem nodeId="two" label="two" />
              </TreeItem>
            </SimpleTreeView>,
          );

          expect(getByTestId('one')).to.have.attribute('aria-expanded', 'false');

          act(() => {
            getByRole('tree').focus();
          });
          fireEvent.keyDown(getByRole('tree'), { key: 'ArrowRight' });

          expect(getByTestId('one')).to.have.attribute('aria-expanded', 'true');
          expect(getByTestId('one')).toHaveVirtualFocus();
        });

        it('should move focus to the first child if focus is on an open node', () => {
          const { getByTestId, getByRole } = render(
            <SimpleTreeView defaultExpandedNodes={['one']} id="tree">
              <TreeItem nodeId="one" label="one" data-testid="one">
                <TreeItem nodeId="two" label="two" data-testid="two" />
              </TreeItem>
            </SimpleTreeView>,
          );

          expect(getByTestId('one')).to.have.attribute('aria-expanded', 'true');

          act(() => {
            getByRole('tree').focus();
          });
          fireEvent.keyDown(getByRole('tree'), { key: 'ArrowRight' });

          expect(getByTestId('two')).toHaveVirtualFocus();
        });

        it('should do nothing if focus is on an end node', () => {
          const { getByRole, getByTestId, getByText } = render(
            <SimpleTreeView defaultExpandedNodes={['one']} id="tree">
              <TreeItem nodeId="one" label="one" data-testid="one">
                <TreeItem nodeId="two" label="two" data-testid="two" />
              </TreeItem>
            </SimpleTreeView>,
          );

          fireEvent.click(getByText('two'));
          act(() => {
            getByRole('tree').focus();
          });

          expect(getByTestId('two')).toHaveVirtualFocus();
          fireEvent.keyDown(getByRole('tree'), { key: 'ArrowRight' });

          expect(getByTestId('two')).toHaveVirtualFocus();
        });
      });

      describe('left arrow interaction', () => {
        it('should close the node if focus is on an open node', () => {
          render(
            <SimpleTreeView id="tree">
              <TreeItem nodeId="one" label="one" data-testid="one">
                <TreeItem nodeId="two" label="two" />
              </TreeItem>
            </SimpleTreeView>,
          );
          const [firstItem] = screen.getAllByRole('treeitem');
          const firstItemLabel = screen.getByText('one');

          fireEvent.click(firstItemLabel);

          expect(firstItem).to.have.attribute('aria-expanded', 'true');

          act(() => {
            screen.getByRole('tree').focus();
          });
          fireEvent.keyDown(screen.getByRole('tree'), { key: 'ArrowLeft' });

          expect(firstItem).to.have.attribute('aria-expanded', 'false');
          expect(screen.getByTestId('one')).toHaveVirtualFocus();
        });

        it("should move focus to the node's parent node if focus is on a child node that is an end node", () => {
          render(
            <SimpleTreeView defaultExpandedNodes={['one']} id="tree">
              <TreeItem nodeId="one" label="one" data-testid="one">
                <TreeItem nodeId="two" label="two" data-testid="two" />
              </TreeItem>
            </SimpleTreeView>,
          );
          const [firstItem] = screen.getAllByRole('treeitem');
          const secondItemLabel = screen.getByText('two');

          expect(firstItem).to.have.attribute('aria-expanded', 'true');

          fireEvent.click(secondItemLabel);
          act(() => {
            screen.getByRole('tree').focus();
          });

          expect(screen.getByTestId('two')).toHaveVirtualFocus();
          fireEvent.keyDown(screen.getByRole('tree'), { key: 'ArrowLeft' });

          expect(screen.getByTestId('one')).toHaveVirtualFocus();
          expect(firstItem).to.have.attribute('aria-expanded', 'true');
        });

        it("should move focus to the node's parent node if focus is on a child node that is closed", () => {
          render(
            <SimpleTreeView id="tree">
              <TreeItem nodeId="one" label="one" data-testid="one">
                <TreeItem nodeId="two" label="two" data-testid="two">
                  <TreeItem nodeId="three" label="three" />
                </TreeItem>
              </TreeItem>
            </SimpleTreeView>,
          );

          fireEvent.click(screen.getByText('one'));

          expect(screen.getByTestId('one')).to.have.attribute('aria-expanded', 'true');

          act(() => {
            screen.getByTestId('two').focus();
          });

          expect(screen.getByTestId('two')).toHaveVirtualFocus();

          fireEvent.keyDown(screen.getByRole('tree'), { key: 'ArrowLeft' });

          expect(screen.getByTestId('one')).toHaveVirtualFocus();
          expect(screen.getByTestId('one')).to.have.attribute('aria-expanded', 'true');
        });

        it('should do nothing if focus is on a root node that is closed', () => {
          const { getByRole, getByTestId } = render(
            <SimpleTreeView id="tree">
              <TreeItem nodeId="one" label="one" data-testid="one">
                <TreeItem nodeId="two" label="two" />
              </TreeItem>
            </SimpleTreeView>,
          );

          act(() => {
            getByRole('tree').focus();
          });

          expect(getByTestId('one')).to.have.attribute('aria-expanded', 'false');
          fireEvent.keyDown(getByRole('tree'), { key: 'ArrowLeft' });
          expect(getByTestId('one')).toHaveVirtualFocus();
        });

        it('should do nothing if focus is on a root node that is an end node', () => {
          const { getByRole, getByTestId } = render(
            <SimpleTreeView id="tree">
              <TreeItem nodeId="one" label="one" data-testid="one" />
            </SimpleTreeView>,
          );

          act(() => {
            getByRole('tree').focus();
          });
          fireEvent.keyDown(getByRole('tree'), { key: 'ArrowLeft' });

          expect(getByTestId('one')).toHaveVirtualFocus();
        });
      });

      describe('down arrow interaction', () => {
        it('moves focus to a sibling node', () => {
          const { getByRole, getByTestId } = render(
            <SimpleTreeView id="tree">
              <TreeItem nodeId="one" label="one" data-testid="one" />
              <TreeItem nodeId="two" label="two" data-testid="two" />
            </SimpleTreeView>,
          );

          act(() => {
            getByRole('tree').focus();
          });
          fireEvent.keyDown(getByRole('tree'), { key: 'ArrowDown' });

          expect(getByTestId('two')).toHaveVirtualFocus();
        });

        it('moves focus to a child node', () => {
          const { getByRole, getByTestId } = render(
            <SimpleTreeView defaultExpandedNodes={['one']} id="tree">
              <TreeItem nodeId="one" label="one" data-testid="one">
                <TreeItem nodeId="two" label="two" data-testid="two" />
              </TreeItem>
            </SimpleTreeView>,
          );

          expect(getByTestId('one')).to.have.attribute('aria-expanded', 'true');

          act(() => {
            getByRole('tree').focus();
          });
          fireEvent.keyDown(getByRole('tree'), { key: 'ArrowDown' });

          expect(getByTestId('two')).toHaveVirtualFocus();
        });

        it('moves focus to a child node works with a dynamic tree', () => {
          function TestComponent() {
            const [hide, setState] = React.useState(false);

            return (
              <React.Fragment>
                <button
                  data-testid="button"
                  type="button"
                  onClick={() => setState((value) => !value)}
                >
                  Toggle Hide
                </button>
                <SimpleTreeView defaultExpandedNodes={['one']} id="tree">
                  {!hide && (
                    <TreeItem nodeId="one" label="one" data-testid="one">
                      <TreeItem nodeId="two" label="two" data-testid="two" />
                    </TreeItem>
                  )}
                  <TreeItem nodeId="three" label="three" />
                </SimpleTreeView>
              </React.Fragment>
            );
          }

          const { getByRole, queryByTestId, getByTestId, getByText } = render(<TestComponent />);

          expect(getByTestId('one')).not.to.equal(null);
          fireEvent.click(getByText('Toggle Hide'));
          expect(queryByTestId('one')).to.equal(null);
          fireEvent.click(getByText('Toggle Hide'));
          expect(getByTestId('one')).not.to.equal(null);

          act(() => {
            getByRole('tree').focus();
          });
          fireEvent.keyDown(getByRole('tree'), { key: 'ArrowDown' });

          expect(getByTestId('two')).toHaveVirtualFocus();
        });

        it("moves focus to a parent's sibling", () => {
          const { getByRole, getByTestId, getByText } = render(
            <SimpleTreeView defaultExpandedNodes={['one']} id="tree">
              <TreeItem nodeId="one" label="one" data-testid="one">
                <TreeItem nodeId="two" label="two" data-testid="two" />
              </TreeItem>
              <TreeItem nodeId="three" label="three" data-testid="three" />
            </SimpleTreeView>,
          );

          expect(getByTestId('one')).to.have.attribute('aria-expanded', 'true');

          fireEvent.click(getByText('two'));
          act(() => {
            getByRole('tree').focus();
          });

          expect(getByTestId('two')).toHaveVirtualFocus();

          fireEvent.keyDown(getByRole('tree'), { key: 'ArrowDown' });

          expect(getByTestId('three')).toHaveVirtualFocus();
        });
      });

      describe('up arrow interaction', () => {
        it('moves focus to a sibling node', () => {
          const { getByRole, getByTestId, getByText } = render(
            <SimpleTreeView id="tree">
              <TreeItem nodeId="one" label="one" data-testid="one" />
              <TreeItem nodeId="two" label="two" data-testid="two" />
            </SimpleTreeView>,
          );

          fireEvent.click(getByText('two'));
          act(() => {
            getByRole('tree').focus();
          });

          expect(getByTestId('two')).toHaveVirtualFocus();

          fireEvent.keyDown(getByRole('tree'), { key: 'ArrowUp' });

          expect(getByTestId('one')).toHaveVirtualFocus();
        });

        it('moves focus to a parent', () => {
          const { getByRole, getByTestId, getByText } = render(
            <SimpleTreeView defaultExpandedNodes={['one']} id="tree">
              <TreeItem nodeId="one" label="one" data-testid="one">
                <TreeItem nodeId="two" label="two" data-testid="two" />
              </TreeItem>
            </SimpleTreeView>,
          );

          expect(getByTestId('one')).to.have.attribute('aria-expanded', 'true');

          fireEvent.click(getByText('two'));
          act(() => {
            getByRole('tree').focus();
          });

          expect(getByTestId('two')).toHaveVirtualFocus();

          fireEvent.keyDown(getByRole('tree'), { key: 'ArrowUp' });

          expect(getByTestId('one')).toHaveVirtualFocus();
        });

        it("moves focus to a sibling's child", () => {
          const { getByRole, getByTestId, getByText } = render(
            <SimpleTreeView defaultExpandedNodes={['one']} id="tree">
              <TreeItem nodeId="one" label="one" data-testid="one">
                <TreeItem nodeId="two" label="two" data-testid="two" />
              </TreeItem>
              <TreeItem nodeId="three" label="three" data-testid="three" />
            </SimpleTreeView>,
          );

          expect(getByTestId('one')).to.have.attribute('aria-expanded', 'true');

          fireEvent.click(getByText('three'));
          act(() => {
            getByRole('tree').focus();
          });

          expect(getByTestId('three')).toHaveVirtualFocus();

          fireEvent.keyDown(getByRole('tree'), { key: 'ArrowUp' });

          expect(getByTestId('two')).toHaveVirtualFocus();
        });
      });

      describe('home key interaction', () => {
        it('moves focus to the first node in the tree', () => {
          const { getByRole, getByTestId, getByText } = render(
            <SimpleTreeView id="tree">
              <TreeItem nodeId="one" label="one" data-testid="one" />
              <TreeItem nodeId="two" label="two" data-testid="two" />
              <TreeItem nodeId="three" label="three" data-testid="three" />
              <TreeItem nodeId="four" label="four" data-testid="four" />
            </SimpleTreeView>,
          );

          fireEvent.click(getByText('four'));
          act(() => {
            getByRole('tree').focus();
          });

          expect(getByTestId('four')).toHaveVirtualFocus();

          fireEvent.keyDown(getByRole('tree'), { key: 'Home' });

          expect(getByTestId('one')).toHaveVirtualFocus();
        });
      });

      describe('end key interaction', () => {
        it('moves focus to the last node in the tree without expanded items', () => {
          const { getByRole, getByTestId } = render(
            <SimpleTreeView id="tree">
              <TreeItem nodeId="one" label="one" data-testid="one" />
              <TreeItem nodeId="two" label="two" data-testid="two" />
              <TreeItem nodeId="three" label="three" data-testid="three" />
              <TreeItem nodeId="four" label="four" data-testid="four" />
            </SimpleTreeView>,
          );

          act(() => {
            getByRole('tree').focus();
          });

          expect(getByTestId('one')).toHaveVirtualFocus();

          fireEvent.keyDown(getByRole('tree'), { key: 'End' });

          expect(getByTestId('four')).toHaveVirtualFocus();
        });

        it('moves focus to the last node in the tree with expanded items', () => {
          const { getByRole, getByTestId } = render(
            <SimpleTreeView defaultExpandedNodes={['four', 'five']} id="tree">
              <TreeItem nodeId="one" label="one" data-testid="one" />
              <TreeItem nodeId="two" label="two" data-testid="two" />
              <TreeItem nodeId="three" label="three" data-testid="three" />
              <TreeItem nodeId="four" label="four" data-testid="four">
                <TreeItem nodeId="five" label="five" data-testid="five">
                  <TreeItem nodeId="six" label="six" data-testid="six" />
                </TreeItem>
              </TreeItem>
            </SimpleTreeView>,
          );

          act(() => {
            getByRole('tree').focus();
          });

          expect(getByTestId('one')).toHaveVirtualFocus();

          fireEvent.keyDown(getByRole('tree'), { key: 'End' });

          expect(getByTestId('six')).toHaveVirtualFocus();
        });
      });

      describe('type-ahead functionality', () => {
        it('moves focus to the next node with a name that starts with the typed character', () => {
          const { getByRole, getByTestId } = render(
            <SimpleTreeView id="tree">
              <TreeItem nodeId="one" label="one" data-testid="one" />
              <TreeItem nodeId="two" label={<span>two</span>} data-testid="two" />
              <TreeItem nodeId="three" label="three" data-testid="three" />
              <TreeItem nodeId="four" label="four" data-testid="four" />
            </SimpleTreeView>,
          );

          act(() => {
            getByRole('tree').focus();
          });

          expect(getByTestId('one')).toHaveVirtualFocus();

          fireEvent.keyDown(getByRole('tree'), { key: 't' });

          expect(getByTestId('two')).toHaveVirtualFocus();

          fireEvent.keyDown(getByRole('tree'), { key: 'f' });

          expect(getByTestId('four')).toHaveVirtualFocus();

          fireEvent.keyDown(getByRole('tree'), { key: 'o' });

          expect(getByTestId('one')).toHaveVirtualFocus();
        });

        it('moves focus to the next node with the same starting character', () => {
          const { getByRole, getByTestId } = render(
            <SimpleTreeView id="tree">
              <TreeItem nodeId="one" label="one" data-testid="one" />
              <TreeItem nodeId="two" label="two" data-testid="two" />
              <TreeItem nodeId="three" label="three" data-testid="three" />
              <TreeItem nodeId="four" label="four" data-testid="four" />
            </SimpleTreeView>,
          );

          act(() => {
            getByRole('tree').focus();
          });

          expect(getByTestId('one')).toHaveVirtualFocus();

          fireEvent.keyDown(getByRole('tree'), { key: 't' });

          expect(getByTestId('two')).toHaveVirtualFocus();

          fireEvent.keyDown(getByRole('tree'), { key: 't' });

          expect(getByTestId('three')).toHaveVirtualFocus();

          fireEvent.keyDown(getByRole('tree'), { key: 't' });

          expect(getByTestId('two')).toHaveVirtualFocus();
        });

        it('should not move focus when pressing a modifier key + letter', () => {
          const { getByRole, getByTestId } = render(
            <SimpleTreeView id="tree">
              <TreeItem nodeId="apple" label="apple" data-testid="apple" />
              <TreeItem nodeId="lemon" label="lemon" data-testid="lemon" />
              <TreeItem nodeId="coconut" label="coconut" data-testid="coconut" />
              <TreeItem nodeId="vanilla" label="vanilla" data-testid="vanilla" />
            </SimpleTreeView>,
          );

          act(() => {
            getByRole('tree').focus();
          });

          expect(getByTestId('apple')).toHaveVirtualFocus();

          fireEvent.keyDown(getByRole('tree'), { key: 'v', ctrlKey: true });

          expect(getByTestId('apple')).toHaveVirtualFocus();

          fireEvent.keyDown(getByRole('tree'), { key: 'v', metaKey: true });

          expect(getByTestId('apple')).toHaveVirtualFocus();

          fireEvent.keyDown(getByRole('tree'), { key: 'v', shiftKey: true });

          expect(getByTestId('apple')).toHaveVirtualFocus();
        });

        it('should not throw when an item is removed', () => {
          function TestComponent() {
            const [hide, setState] = React.useState(false);
            return (
              <React.Fragment>
                <button type="button" onClick={() => setState(true)}>
                  Hide
                </button>
                <SimpleTreeView id="tree">
                  {!hide && <TreeItem nodeId="hide" label="ab" />}
                  <TreeItem nodeId="keyDown" label="keyDown" data-testid="keyDown" />
                  <TreeItem nodeId="navTo" label="ac" data-testid="navTo" />
                </SimpleTreeView>
              </React.Fragment>
            );
          }

          const { getByRole, getByText, getByTestId } = render(<TestComponent />);
          fireEvent.click(getByText('Hide'));
          expect(getByTestId('navTo')).not.toHaveVirtualFocus();

          expect(() => {
            act(() => {
              getByRole('tree').focus();
            });

            expect(getByTestId('keyDown')).toHaveVirtualFocus();

            fireEvent.keyDown(getByRole('tree'), { key: 'a' });
          }).not.to.throw();

          expect(getByTestId('navTo')).toHaveVirtualFocus();
        });
      });

      describe('asterisk key interaction', () => {
        it('expands all siblings that are at the same level as the current node', () => {
          const onExpandedNodesChange = spy();

          const { getByRole, getByTestId } = render(
            <SimpleTreeView onExpandedNodesChange={onExpandedNodesChange}>
              <TreeItem nodeId="one" label="one" data-testid="one">
                <TreeItem nodeId="two" label="two" data-testid="two" />
              </TreeItem>
              <TreeItem nodeId="three" label="three" data-testid="three">
                <TreeItem nodeId="four" label="four" data-testid="four" />
              </TreeItem>
              <TreeItem nodeId="five" label="five" data-testid="five">
                <TreeItem nodeId="six" label="six" data-testid="six">
                  <TreeItem nodeId="seven" label="seven" data-testid="seven" />
                </TreeItem>
              </TreeItem>
              <TreeItem nodeId="eight" label="eight" data-testid="eight" />
            </SimpleTreeView>,
          );

          act(() => {
            getByRole('tree').focus();
          });

          expect(getByTestId('one')).to.have.attribute('aria-expanded', 'false');
          expect(getByTestId('three')).to.have.attribute('aria-expanded', 'false');
          expect(getByTestId('five')).to.have.attribute('aria-expanded', 'false');

          fireEvent.keyDown(getByRole('tree'), { key: '*' });

          expect(onExpandedNodesChange.args[0][1]).to.have.length(3);

          expect(getByTestId('one')).to.have.attribute('aria-expanded', 'true');
          expect(getByTestId('three')).to.have.attribute('aria-expanded', 'true');
          expect(getByTestId('five')).to.have.attribute('aria-expanded', 'true');
          expect(getByTestId('six')).to.have.attribute('aria-expanded', 'false');
          expect(getByTestId('eight')).not.to.have.attribute('aria-expanded');
        });
      });
    });

    describe('Expansion', () => {
      describe('enter key interaction', () => {
        it('expands a node with children', () => {
          const { getByRole, getByTestId } = render(
            <SimpleTreeView>
              <TreeItem nodeId="one" label="one" data-testid="one">
                <TreeItem nodeId="two" label="two" data-testid="two" />
              </TreeItem>
            </SimpleTreeView>,
          );

          act(() => {
            getByRole('tree').focus();
          });

          expect(getByTestId('one')).to.have.attribute('aria-expanded', 'false');

          fireEvent.keyDown(getByRole('tree'), { key: 'Enter' });

          expect(getByTestId('one')).to.have.attribute('aria-expanded', 'true');
        });

        it('collapses a node with children', () => {
          const { getByRole, getByTestId, getByText } = render(
            <SimpleTreeView>
              <TreeItem nodeId="one" label="one" data-testid="one">
                <TreeItem nodeId="two" label="two" data-testid="two" />
              </TreeItem>
            </SimpleTreeView>,
          );

          fireEvent.click(getByText('one'));
          act(() => {
            getByRole('tree').focus();
          });

          expect(getByTestId('one')).to.have.attribute('aria-expanded', 'true');

          fireEvent.keyDown(getByRole('tree'), { key: 'Enter' });

          expect(getByTestId('one')).to.have.attribute('aria-expanded', 'false');
        });
      });
    });

    describe('Single Selection', () => {
      describe('keyboard', () => {
        it('should select a node when space is pressed', () => {
          const { getByRole, getByTestId } = render(
            <SimpleTreeView>
              <TreeItem nodeId="one" label="one" data-testid="one" />
            </SimpleTreeView>,
          );

          act(() => {
            getByRole('tree').focus();
          });

          expect(getByTestId('one')).not.to.have.attribute('aria-selected');

          fireEvent.keyDown(getByRole('tree'), { key: ' ' });

          expect(getByTestId('one')).to.have.attribute('aria-selected', 'true');
        });

        it('should not deselect a node when space is pressed on a selected node', () => {
          const { getByRole, getByTestId } = render(
            <SimpleTreeView defaultSelectedNodes="one">
              <TreeItem nodeId="one" label="one" data-testid="one" />
            </SimpleTreeView>,
          );

          act(() => {
            getByRole('tree').focus();
          });

          expect(getByTestId('one')).toHaveVirtualFocus();
          expect(getByTestId('one')).to.have.attribute('aria-selected', 'true');

          fireEvent.keyDown(getByRole('tree'), { key: ' ' });

          expect(getByTestId('one')).to.have.attribute('aria-selected', 'true');
        });

        it('should not select a node when space is pressed and disableSelection', () => {
          const { getByRole, getByTestId } = render(
            <SimpleTreeView disableSelection>
              <TreeItem nodeId="one" label="one" data-testid="one" />
            </SimpleTreeView>,
          );

          act(() => {
            getByRole('tree').focus();
          });
          fireEvent.keyDown(getByRole('tree'), { key: ' ' });

          expect(getByTestId('one')).not.to.have.attribute('aria-selected');
        });

        it('should select a node when Enter is pressed and the node is not selected', () => {
          const { getByRole, getByTestId } = render(
            <SimpleTreeView>
              <TreeItem nodeId="one" label="one" data-testid="one" />
            </SimpleTreeView>,
          );

          act(() => {
            getByRole('tree').focus();
          });
          fireEvent.keyDown(getByRole('tree'), { key: 'Enter' });

          expect(getByTestId('one')).to.have.attribute('aria-selected');
        });

        it('should not un-select a node when Enter is pressed and the node is selected', () => {
          const { getByRole, getByTestId } = render(
            <SimpleTreeView defaultSelectedNodes="one">
              <TreeItem nodeId="one" label="one" data-testid="one" />
            </SimpleTreeView>,
          );

          act(() => {
            getByRole('tree').focus();
          });
          fireEvent.keyDown(getByRole('tree'), { key: 'Enter' });

          expect(getByTestId('one')).to.have.attribute('aria-selected');
        });
      });

      describe('mouse', () => {
        it('should select a node when click', () => {
          const { getByText, getByTestId } = render(
            <SimpleTreeView>
              <TreeItem nodeId="one" label="one" data-testid="one" />
            </SimpleTreeView>,
          );

          expect(getByTestId('one')).not.to.have.attribute('aria-selected');
          fireEvent.click(getByText('one'));
          expect(getByTestId('one')).to.have.attribute('aria-selected', 'true');
        });

        it('should not deselect a node when clicking a selected node', () => {
          const { getByText, getByTestId } = render(
            <SimpleTreeView defaultSelectedNodes="one">
              <TreeItem nodeId="one" label="one" data-testid="one" />
            </SimpleTreeView>,
          );

          expect(getByTestId('one')).to.have.attribute('aria-selected', 'true');
          fireEvent.click(getByText('one'));
          expect(getByTestId('one')).to.have.attribute('aria-selected', 'true');
        });

        it('should not select a node when click and disableSelection', () => {
          const { getByText, getByTestId } = render(
            <SimpleTreeView disableSelection>
              <TreeItem nodeId="one" label="one" data-testid="one" />
            </SimpleTreeView>,
          );

          fireEvent.click(getByText('one'));
          expect(getByTestId('one')).not.to.have.attribute('aria-selected');
        });
      });
    });

    describe('Multi Selection', () => {
      describe('deselection', () => {
        describe('mouse behavior when multiple nodes are selected', () => {
          specify('clicking a selected node holding ctrl should deselect the node', () => {
            const { getByText, getByTestId } = render(
              <SimpleTreeView multiSelect defaultSelectedNodes={['one', 'two']}>
                <TreeItem nodeId="one" label="one" data-testid="one" />
                <TreeItem nodeId="two" label="two" data-testid="two" />
              </SimpleTreeView>,
            );

            expect(getByTestId('one')).to.have.attribute('aria-selected', 'true');
            expect(getByTestId('two')).to.have.attribute('aria-selected', 'true');
            fireEvent.click(getByText('one'), { ctrlKey: true });
            expect(getByTestId('one')).to.have.attribute('aria-selected', 'false');
            expect(getByTestId('two')).to.have.attribute('aria-selected', 'true');
          });

          specify('clicking a selected node holding meta should deselect the node', () => {
            const { getByText, getByTestId } = render(
              <SimpleTreeView multiSelect defaultSelectedNodes={['one', 'two']}>
                <TreeItem nodeId="one" label="one" data-testid="one" />
                <TreeItem nodeId="two" label="two" data-testid="two" />
              </SimpleTreeView>,
            );

            expect(getByTestId('one')).to.have.attribute('aria-selected', 'true');
            expect(getByTestId('two')).to.have.attribute('aria-selected', 'true');
            fireEvent.click(getByText('one'), { metaKey: true });
            expect(getByTestId('one')).to.have.attribute('aria-selected', 'false');
            expect(getByTestId('two')).to.have.attribute('aria-selected', 'true');
          });
        });

        describe('mouse behavior when one node is selected', () => {
          it('clicking a selected node shout not deselect the node', () => {
            const { getByText, getByTestId } = render(
              <SimpleTreeView multiSelect defaultSelectedNodes={['one']}>
                <TreeItem nodeId="one" label="one" data-testid="one" />
                <TreeItem nodeId="two" label="two" data-testid="two" />
              </SimpleTreeView>,
            );

            expect(getByTestId('one')).to.have.attribute('aria-selected', 'true');
            expect(getByTestId('two')).to.have.attribute('aria-selected', 'false');
            fireEvent.click(getByText('one'));
            expect(getByTestId('one')).to.have.attribute('aria-selected', 'true');
            expect(getByTestId('two')).to.have.attribute('aria-selected', 'false');
          });
        });

        it('should deselect the node when pressing space on a selected node', () => {
          const { getByTestId, getByRole } = render(
            <SimpleTreeView multiSelect defaultSelectedNodes={['one']}>
              <TreeItem nodeId="one" label="one" data-testid="one" />
            </SimpleTreeView>,
          );

          act(() => {
            getByRole('tree').focus();
          });

          expect(getByTestId('one')).toHaveVirtualFocus();
          expect(getByTestId('one')).to.have.attribute('aria-selected', 'true');
          fireEvent.keyDown(getByRole('tree'), { key: ' ' });
          expect(getByTestId('one')).to.have.attribute('aria-selected', 'false');
        });
      });

      describe('range selection', () => {
        specify('keyboard arrow', () => {
          const { getByRole, getByTestId, getByText, queryAllByRole } = render(
            <SimpleTreeView multiSelect defaultExpandedNodes={['two']} id="tree">
              <TreeItem nodeId="one" label="one" data-testid="one" />
              <TreeItem nodeId="two" label="two" data-testid="two" />
              <TreeItem nodeId="three" label="three" data-testid="three" />
              <TreeItem nodeId="four" label="four" data-testid="four" />
              <TreeItem nodeId="five" label="five" data-testid="five" />
            </SimpleTreeView>,
          );

          fireEvent.click(getByText('three'));
          act(() => {
            getByRole('tree').focus();
          });

          expect(getByTestId('three')).to.have.attribute('aria-selected', 'true');

          fireEvent.keyDown(getByRole('tree'), { key: 'ArrowDown', shiftKey: true });

          expect(getByTestId('four')).toHaveVirtualFocus();
          expect(queryAllByRole('treeitem', { selected: true })).to.have.length(2);

          fireEvent.keyDown(getByRole('tree'), { key: 'ArrowDown', shiftKey: true });

          expect(getByTestId('three')).to.have.attribute('aria-selected', 'true');
          expect(getByTestId('four')).to.have.attribute('aria-selected', 'true');
          expect(getByTestId('five')).to.have.attribute('aria-selected', 'true');
          expect(queryAllByRole('treeitem', { selected: true })).to.have.length(3);

          fireEvent.keyDown(getByRole('tree'), { key: 'ArrowUp', shiftKey: true });

          expect(getByTestId('four')).toHaveVirtualFocus();
          expect(queryAllByRole('treeitem', { selected: true })).to.have.length(2);

          fireEvent.keyDown(getByRole('tree'), { key: 'ArrowUp', shiftKey: true });

          expect(queryAllByRole('treeitem', { selected: true })).to.have.length(1);

          fireEvent.keyDown(getByRole('tree'), { key: 'ArrowUp', shiftKey: true });

          expect(queryAllByRole('treeitem', { selected: true })).to.have.length(2);

          fireEvent.keyDown(getByRole('tree'), { key: 'ArrowUp', shiftKey: true });

          expect(getByTestId('one')).to.have.attribute('aria-selected', 'true');
          expect(getByTestId('two')).to.have.attribute('aria-selected', 'true');
          expect(getByTestId('three')).to.have.attribute('aria-selected', 'true');
          expect(getByTestId('four')).to.have.attribute('aria-selected', 'false');
          expect(getByTestId('five')).to.have.attribute('aria-selected', 'false');
          expect(queryAllByRole('treeitem', { selected: true })).to.have.length(3);
        });

        specify('keyboard arrow does not select when selectionDisabled', () => {
          const { getByRole, getByTestId, queryAllByRole } = render(
            <SimpleTreeView disableSelection multiSelect id="tree">
              <TreeItem nodeId="one" label="one" data-testid="one" />
              <TreeItem nodeId="two" label="two" data-testid="two" />
              <TreeItem nodeId="three" label="three" data-testid="three" />
              <TreeItem nodeId="four" label="four" data-testid="four" />
              <TreeItem nodeId="five" label="five" data-testid="five" />
            </SimpleTreeView>,
          );

          act(() => {
            getByRole('tree').focus();
          });

          fireEvent.keyDown(getByRole('tree'), { key: 'ArrowDown', shiftKey: true });

          expect(getByTestId('two')).toHaveVirtualFocus();
          expect(queryAllByRole('treeitem', { selected: true })).to.have.length(0);

          fireEvent.keyDown(getByRole('tree'), { key: 'ArrowUp', shiftKey: true });

          expect(queryAllByRole('treeitem', { selected: true })).to.have.length(0);
        });

        specify('keyboard arrow merge', () => {
          const { getByRole, getByTestId, getByText, queryAllByRole } = render(
            <SimpleTreeView multiSelect defaultExpandedNodes={['two']}>
              <TreeItem nodeId="one" label="one" data-testid="one" />
              <TreeItem nodeId="two" label="two" data-testid="two" />
              <TreeItem nodeId="three" label="three" data-testid="three" />
              <TreeItem nodeId="four" label="four" data-testid="four" />
              <TreeItem nodeId="five" label="five" data-testid="five" />
              <TreeItem nodeId="six" label="six" data-testid="six" />
            </SimpleTreeView>,
          );

          fireEvent.click(getByText('three'));
          act(() => {
            getByRole('tree').focus();
          });

          expect(getByTestId('three')).to.have.attribute('aria-selected', 'true');

          fireEvent.keyDown(getByRole('tree'), { key: 'ArrowUp', shiftKey: true });
          fireEvent.click(getByText('six'), { ctrlKey: true });
          fireEvent.keyDown(getByRole('tree'), { key: 'ArrowUp', shiftKey: true });
          fireEvent.keyDown(getByRole('tree'), { key: 'ArrowUp', shiftKey: true });
          fireEvent.keyDown(getByRole('tree'), { key: 'ArrowUp', shiftKey: true });
          fireEvent.keyDown(getByRole('tree'), { key: 'ArrowUp', shiftKey: true });

          expect(queryAllByRole('treeitem', { selected: true })).to.have.length(5);

          fireEvent.keyDown(getByRole('tree'), { key: 'ArrowDown', shiftKey: true });
          fireEvent.keyDown(getByRole('tree'), { key: 'ArrowDown', shiftKey: true });

          expect(queryAllByRole('treeitem', { selected: true })).to.have.length(3);
        });

        specify('keyboard space', () => {
          const { getByRole, getByTestId, getByText } = render(
            <SimpleTreeView multiSelect defaultExpandedNodes={['two']}>
              <TreeItem nodeId="one" label="one" data-testid="one" />
              <TreeItem nodeId="two" label="two" data-testid="two">
                <TreeItem nodeId="three" label="three" data-testid="three" />
                <TreeItem nodeId="four" label="four" data-testid="four" />
              </TreeItem>
              <TreeItem nodeId="five" label="five" data-testid="five">
                <TreeItem nodeId="six" label="six" data-testid="six" />
                <TreeItem nodeId="seven" label="seven" data-testid="seven" />
              </TreeItem>
              <TreeItem nodeId="eight" label="eight" data-testid="eight" />
              <TreeItem nodeId="nine" label="nine" data-testid="nine" />
            </SimpleTreeView>,
          );
          const tree = getByRole('tree');

          fireEvent.click(getByText('five'));
          act(() => {
            tree.focus();
          });
          for (let i = 0; i < 5; i += 1) {
            fireEvent.keyDown(tree, { key: 'ArrowDown' });
          }
          fireEvent.keyDown(tree, { key: ' ', shiftKey: true });

          expect(getByTestId('five')).to.have.attribute('aria-selected', 'true');
          expect(getByTestId('six')).to.have.attribute('aria-selected', 'true');
          expect(getByTestId('seven')).to.have.attribute('aria-selected', 'true');
          expect(getByTestId('eight')).to.have.attribute('aria-selected', 'true');
          expect(getByTestId('nine')).to.have.attribute('aria-selected', 'true');
          for (let i = 0; i < 9; i += 1) {
            fireEvent.keyDown(tree, { key: 'ArrowUp' });
          }
          fireEvent.keyDown(tree, { key: ' ', shiftKey: true });
          expect(getByTestId('one')).to.have.attribute('aria-selected', 'true');
          expect(getByTestId('two')).to.have.attribute('aria-selected', 'true');
          expect(getByTestId('three')).to.have.attribute('aria-selected', 'true');
          expect(getByTestId('four')).to.have.attribute('aria-selected', 'true');
          expect(getByTestId('five')).to.have.attribute('aria-selected', 'true');
          expect(getByTestId('six')).to.have.attribute('aria-selected', 'false');
          expect(getByTestId('seven')).to.have.attribute('aria-selected', 'false');
          expect(getByTestId('eight')).to.have.attribute('aria-selected', 'false');
          expect(getByTestId('nine')).to.have.attribute('aria-selected', 'false');
        });

        specify('keyboard home and end', () => {
          const { getByRole, getByTestId } = render(
            <SimpleTreeView multiSelect defaultExpandedNodes={['two', 'five']}>
              <TreeItem nodeId="one" label="one" data-testid="one" />
              <TreeItem nodeId="two" label="two" data-testid="two">
                <TreeItem nodeId="three" label="three" data-testid="three" />
                <TreeItem nodeId="four" label="four" data-testid="four" />
              </TreeItem>
              <TreeItem nodeId="five" label="five" data-testid="five">
                <TreeItem nodeId="six" label="six" data-testid="six" />
                <TreeItem nodeId="seven" label="seven" data-testid="seven" />
              </TreeItem>
              <TreeItem nodeId="eight" label="eight" data-testid="eight" />
              <TreeItem nodeId="nine" label="nine" data-testid="nine" />
            </SimpleTreeView>,
          );

          act(() => {
            getByTestId('five').focus();
          });

          fireEvent.keyDown(getByRole('tree'), {
            key: 'End',
            shiftKey: true,
            ctrlKey: true,
          });

          expect(getByTestId('five')).to.have.attribute('aria-selected', 'true');
          expect(getByTestId('six')).to.have.attribute('aria-selected', 'true');
          expect(getByTestId('seven')).to.have.attribute('aria-selected', 'true');
          expect(getByTestId('eight')).to.have.attribute('aria-selected', 'true');
          expect(getByTestId('nine')).to.have.attribute('aria-selected', 'true');

          fireEvent.keyDown(getByRole('tree'), {
            key: 'Home',
            shiftKey: true,
            ctrlKey: true,
          });

          expect(getByTestId('one')).to.have.attribute('aria-selected', 'true');
          expect(getByTestId('two')).to.have.attribute('aria-selected', 'true');
          expect(getByTestId('three')).to.have.attribute('aria-selected', 'true');
          expect(getByTestId('four')).to.have.attribute('aria-selected', 'true');
          expect(getByTestId('five')).to.have.attribute('aria-selected', 'true');
          expect(getByTestId('six')).to.have.attribute('aria-selected', 'false');
          expect(getByTestId('seven')).to.have.attribute('aria-selected', 'false');
          expect(getByTestId('eight')).to.have.attribute('aria-selected', 'false');
          expect(getByTestId('nine')).to.have.attribute('aria-selected', 'false');
        });

        specify('keyboard home and end do not select when selectionDisabled', () => {
          const { getByRole, getByText, queryAllByRole } = render(
            <SimpleTreeView disableSelection multiSelect defaultExpandedNodes={['two', 'five']}>
              <TreeItem nodeId="one" label="one" data-testid="one" />
              <TreeItem nodeId="two" label="two" data-testid="two">
                <TreeItem nodeId="three" label="three" data-testid="three" />
                <TreeItem nodeId="four" label="four" data-testid="four" />
              </TreeItem>
              <TreeItem nodeId="five" label="five" data-testid="five">
                <TreeItem nodeId="six" label="six" data-testid="six" />
                <TreeItem nodeId="seven" label="seven" data-testid="seven" />
              </TreeItem>
              <TreeItem nodeId="eight" label="eight" data-testid="eight" />
              <TreeItem nodeId="nine" label="nine" data-testid="nine" />
            </SimpleTreeView>,
          );

          fireEvent.click(getByText('five'));
          fireEvent.click(getByText('five'));
          // Focus node five
          act(() => {
            getByRole('tree').focus();
          });
          fireEvent.keyDown(getByRole('tree'), {
            key: 'End',
            shiftKey: true,
            ctrlKey: true,
          });

          expect(queryAllByRole('treeitem', { selected: true })).to.have.length(0);

          fireEvent.keyDown(getByRole('tree'), {
            key: 'Home',
            shiftKey: true,
            ctrlKey: true,
          });

          expect(queryAllByRole('treeitem', { selected: true })).to.have.length(0);
        });

        specify('mouse', () => {
          const { getByTestId, getByText } = render(
            <SimpleTreeView multiSelect defaultExpandedNodes={['two']}>
              <TreeItem nodeId="one" label="one" data-testid="one" />
              <TreeItem nodeId="two" label="two" data-testid="two">
                <TreeItem nodeId="three" label="three" data-testid="three" />
                <TreeItem nodeId="four" label="four" data-testid="four" />
              </TreeItem>
              <TreeItem nodeId="five" label="five" data-testid="five">
                <TreeItem nodeId="six" label="six" data-testid="six" />
                <TreeItem nodeId="seven" label="seven" data-testid="seven" />
              </TreeItem>
              <TreeItem nodeId="eight" label="eight" data-testid="eight" />
              <TreeItem nodeId="nine" label="nine" data-testid="nine" />
            </SimpleTreeView>,
          );

          fireEvent.click(getByText('five'));
          fireEvent.click(getByText('nine'), { shiftKey: true });
          expect(getByTestId('five')).to.have.attribute('aria-selected', 'true');
          expect(getByTestId('six')).to.have.attribute('aria-selected', 'true');
          expect(getByTestId('seven')).to.have.attribute('aria-selected', 'true');
          expect(getByTestId('eight')).to.have.attribute('aria-selected', 'true');
          expect(getByTestId('nine')).to.have.attribute('aria-selected', 'true');
          fireEvent.click(getByText('one'), { shiftKey: true });
          expect(getByTestId('one')).to.have.attribute('aria-selected', 'true');
          expect(getByTestId('two')).to.have.attribute('aria-selected', 'true');
          expect(getByTestId('three')).to.have.attribute('aria-selected', 'true');
          expect(getByTestId('four')).to.have.attribute('aria-selected', 'true');
          expect(getByTestId('five')).to.have.attribute('aria-selected', 'true');
        });

        it('mouse behavior after deselection', () => {
          const { getByTestId, getByText } = render(
            <SimpleTreeView multiSelect>
              <TreeItem nodeId="one" label="one" data-testid="one" />
              <TreeItem nodeId="two" label="two" data-testid="two" />
              <TreeItem nodeId="three" label="three" data-testid="three" />
              <TreeItem nodeId="four" label="four" data-testid="four" />
              <TreeItem nodeId="five" label="five" data-testid="five" />
            </SimpleTreeView>,
          );

          fireEvent.click(getByText('one'));
          fireEvent.click(getByText('two'), { ctrlKey: true });
          expect(getByTestId('one')).to.have.attribute('aria-selected', 'true');
          expect(getByTestId('two')).to.have.attribute('aria-selected', 'true');
          fireEvent.click(getByText('two'), { ctrlKey: true });
          expect(getByTestId('one')).to.have.attribute('aria-selected', 'true');
          expect(getByTestId('two')).to.have.attribute('aria-selected', 'false');

          fireEvent.click(getByText('five'), { shiftKey: true });
          expect(getByTestId('one')).to.have.attribute('aria-selected', 'true');
          expect(getByTestId('two')).to.have.attribute('aria-selected', 'true');
          expect(getByTestId('three')).to.have.attribute('aria-selected', 'true');
          expect(getByTestId('four')).to.have.attribute('aria-selected', 'true');
          expect(getByTestId('five')).to.have.attribute('aria-selected', 'true');
          fireEvent.click(getByText('one'), { shiftKey: true });
          expect(getByTestId('one')).to.have.attribute('aria-selected', 'true');
          expect(getByTestId('two')).to.have.attribute('aria-selected', 'true');
          expect(getByTestId('three')).to.have.attribute('aria-selected', 'false');
          expect(getByTestId('four')).to.have.attribute('aria-selected', 'false');
          expect(getByTestId('five')).to.have.attribute('aria-selected', 'false');
        });

        specify('mouse does not range select when selectionDisabled', () => {
          const { getByText, queryAllByRole } = render(
            <SimpleTreeView disableSelection multiSelect defaultExpandedNodes={['two']}>
              <TreeItem nodeId="one" label="one" data-testid="one" />
              <TreeItem nodeId="two" label="two" data-testid="two">
                <TreeItem nodeId="three" label="three" data-testid="three" />
                <TreeItem nodeId="four" label="four" data-testid="four" />
              </TreeItem>
              <TreeItem nodeId="five" label="five" data-testid="five">
                <TreeItem nodeId="six" label="six" data-testid="six" />
                <TreeItem nodeId="seven" label="seven" data-testid="seven" />
              </TreeItem>
              <TreeItem nodeId="eight" label="eight" data-testid="eight" />
              <TreeItem nodeId="nine" label="nine" data-testid="nine" />
            </SimpleTreeView>,
          );

          fireEvent.click(getByText('five'));
          fireEvent.click(getByText('nine'), { shiftKey: true });
          expect(queryAllByRole('treeitem', { selected: true })).to.have.length(0);
        });
      });

      describe('multi selection', () => {
        specify('keyboard', () => {
          const { getByRole, getByTestId } = render(
            <SimpleTreeView multiSelect>
              <TreeItem nodeId="one" label="one" data-testid="one" />
              <TreeItem nodeId="two" label="two" data-testid="two" />
            </SimpleTreeView>,
          );

          act(() => {
            getByRole('tree').focus();
          });

          expect(getByTestId('one')).to.have.attribute('aria-selected', 'false');
          expect(getByTestId('two')).to.have.attribute('aria-selected', 'false');

          fireEvent.keyDown(getByRole('tree'), { key: ' ' });

          expect(getByTestId('one')).to.have.attribute('aria-selected', 'true');
          expect(getByTestId('two')).to.have.attribute('aria-selected', 'false');

          fireEvent.keyDown(getByRole('tree'), { key: 'ArrowDown' });
          fireEvent.keyDown(getByRole('tree'), { key: ' ' });

          expect(getByTestId('one')).to.have.attribute('aria-selected', 'true');
          expect(getByTestId('two')).to.have.attribute('aria-selected', 'true');
        });

        specify('keyboard holding ctrl', () => {
          const { getByRole, getByTestId } = render(
            <SimpleTreeView multiSelect>
              <TreeItem nodeId="one" label="one" data-testid="one" />
              <TreeItem nodeId="two" label="two" data-testid="two" />
            </SimpleTreeView>,
          );

          act(() => {
            getByRole('tree').focus();
          });

          expect(getByTestId('one')).to.have.attribute('aria-selected', 'false');
          expect(getByTestId('two')).to.have.attribute('aria-selected', 'false');

          fireEvent.keyDown(getByRole('tree'), { key: ' ' });

          expect(getByTestId('one')).to.have.attribute('aria-selected', 'true');
          expect(getByTestId('two')).to.have.attribute('aria-selected', 'false');

          fireEvent.keyDown(getByRole('tree'), { key: 'ArrowDown' });
          fireEvent.keyDown(getByRole('tree'), { key: ' ', ctrlKey: true });

          expect(getByTestId('one')).to.have.attribute('aria-selected', 'true');
          expect(getByTestId('two')).to.have.attribute('aria-selected', 'true');
        });

        specify('mouse', () => {
          const { getByText, getByTestId } = render(
            <SimpleTreeView multiSelect>
              <TreeItem nodeId="one" label="one" data-testid="one" />
              <TreeItem nodeId="two" label="two" data-testid="two" />
            </SimpleTreeView>,
          );

          expect(getByTestId('one')).to.have.attribute('aria-selected', 'false');
          expect(getByTestId('two')).to.have.attribute('aria-selected', 'false');

          fireEvent.click(getByText('one'));

          expect(getByTestId('one')).to.have.attribute('aria-selected', 'true');
          expect(getByTestId('two')).to.have.attribute('aria-selected', 'false');

          fireEvent.click(getByText('two'));

          expect(getByTestId('one')).to.have.attribute('aria-selected', 'false');
          expect(getByTestId('two')).to.have.attribute('aria-selected', 'true');
        });

        specify('mouse using ctrl', () => {
          const { getByTestId, getByText } = render(
            <SimpleTreeView multiSelect>
              <TreeItem nodeId="one" label="one" data-testid="one" />
              <TreeItem nodeId="two" label="two" data-testid="two" />
            </SimpleTreeView>,
          );

          expect(getByTestId('one')).to.have.attribute('aria-selected', 'false');
          expect(getByTestId('two')).to.have.attribute('aria-selected', 'false');
          fireEvent.click(getByText('one'));
          expect(getByTestId('one')).to.have.attribute('aria-selected', 'true');
          expect(getByTestId('two')).to.have.attribute('aria-selected', 'false');
          fireEvent.click(getByText('two'), { ctrlKey: true });
          expect(getByTestId('one')).to.have.attribute('aria-selected', 'true');
          expect(getByTestId('two')).to.have.attribute('aria-selected', 'true');
        });

        specify('mouse using meta', () => {
          const { getByTestId, getByText } = render(
            <SimpleTreeView multiSelect>
              <TreeItem nodeId="one" label="one" data-testid="one" />
              <TreeItem nodeId="two" label="two" data-testid="two" />
            </SimpleTreeView>,
          );

          expect(getByTestId('one')).to.have.attribute('aria-selected', 'false');
          expect(getByTestId('two')).to.have.attribute('aria-selected', 'false');
          fireEvent.click(getByText('one'));
          expect(getByTestId('one')).to.have.attribute('aria-selected', 'true');
          expect(getByTestId('two')).to.have.attribute('aria-selected', 'false');
          fireEvent.click(getByText('two'), { metaKey: true });
          expect(getByTestId('one')).to.have.attribute('aria-selected', 'true');
          expect(getByTestId('two')).to.have.attribute('aria-selected', 'true');
        });
      });

      specify('ctrl + a selects all', () => {
        const { getByRole, queryAllByRole } = render(
          <SimpleTreeView multiSelect>
            <TreeItem nodeId="one" label="one" data-testid="one" />
            <TreeItem nodeId="two" label="two" data-testid="two" />
            <TreeItem nodeId="three" label="three" data-testid="three" />
            <TreeItem nodeId="four" label="four" data-testid="four" />
            <TreeItem nodeId="five" label="five" data-testid="five" />
          </SimpleTreeView>,
        );

        act(() => {
          getByRole('tree').focus();
        });
        fireEvent.keyDown(getByRole('tree'), { key: 'a', ctrlKey: true });

        expect(queryAllByRole('treeitem', { selected: true })).to.have.length(5);
      });

      specify('ctrl + a does not select all when disableSelection', () => {
        const { getByRole, queryAllByRole } = render(
          <SimpleTreeView disableSelection multiSelect>
            <TreeItem nodeId="one" label="one" data-testid="one" />
            <TreeItem nodeId="two" label="two" data-testid="two" />
            <TreeItem nodeId="three" label="three" data-testid="three" />
            <TreeItem nodeId="four" label="four" data-testid="four" />
            <TreeItem nodeId="five" label="five" data-testid="five" />
          </SimpleTreeView>,
        );

        act(() => {
          getByRole('tree').focus();
        });
        fireEvent.keyDown(getByRole('tree'), { key: 'a', ctrlKey: true });

        expect(queryAllByRole('treeitem', { selected: true })).to.have.length(0);
      });
    });
  });

  describe('prop: disabled', () => {
    describe('selection', () => {
      describe('mouse', () => {
        it('should prevent selection by mouse', () => {
          const { getByText, getByTestId } = render(
            <SimpleTreeView>
              <TreeItem nodeId="one" label="one" disabled data-testid="one" />
            </SimpleTreeView>,
          );

          fireEvent.click(getByText('one'));
          expect(getByTestId('one')).not.to.have.attribute('aria-selected');
        });

        it('should prevent node triggering start of range selection', () => {
          const { getByText, getByTestId } = render(
            <SimpleTreeView multiSelect>
              <TreeItem nodeId="one" label="one" disabled data-testid="one" />
              <TreeItem nodeId="two" label="two" data-testid="two" />
              <TreeItem nodeId="three" label="three" data-testid="three" />
              <TreeItem nodeId="four" label="four" data-testid="four" />
            </SimpleTreeView>,
          );

          fireEvent.click(getByText('one'));
          fireEvent.click(getByText('four'), { shiftKey: true });
          expect(getByTestId('one')).to.have.attribute('aria-selected', 'false');
          expect(getByTestId('two')).to.have.attribute('aria-selected', 'false');
          expect(getByTestId('three')).to.have.attribute('aria-selected', 'false');
          expect(getByTestId('four')).to.have.attribute('aria-selected', 'false');
        });

        it('should prevent node being selected as part of range selection', () => {
          const { getByText, getByTestId } = render(
            <SimpleTreeView multiSelect>
              <TreeItem nodeId="one" label="one" data-testid="one" />
              <TreeItem nodeId="two" label="two" disabled data-testid="two" />
              <TreeItem nodeId="three" label="three" data-testid="three" />
              <TreeItem nodeId="four" label="four" data-testid="four" />
            </SimpleTreeView>,
          );

          fireEvent.click(getByText('one'));
          fireEvent.click(getByText('four'), { shiftKey: true });
          expect(getByTestId('one')).to.have.attribute('aria-selected', 'true');
          expect(getByTestId('two')).to.have.attribute('aria-selected', 'false');
          expect(getByTestId('three')).to.have.attribute('aria-selected', 'true');
          expect(getByTestId('four')).to.have.attribute('aria-selected', 'true');
        });

        it('should prevent node triggering end of range selection', () => {
          const { getByText, getByTestId } = render(
            <SimpleTreeView multiSelect>
              <TreeItem nodeId="one" label="one" data-testid="one" />
              <TreeItem nodeId="two" label="two" data-testid="two" />
              <TreeItem nodeId="three" label="three" data-testid="three" />
              <TreeItem nodeId="four" label="four" disabled data-testid="four" />
            </SimpleTreeView>,
          );

          fireEvent.click(getByText('one'));
          fireEvent.click(getByText('four'), { shiftKey: true });
          expect(getByTestId('one')).to.have.attribute('aria-selected', 'true');
          expect(getByTestId('two')).to.have.attribute('aria-selected', 'false');
          expect(getByTestId('three')).to.have.attribute('aria-selected', 'false');
          expect(getByTestId('four')).to.have.attribute('aria-selected', 'false');
        });
      });

      describe('keyboard', () => {
        describe('`disabledItemsFocusable={true}`', () => {
          it('should prevent selection by keyboard', () => {
            const { getByRole, getByTestId } = render(
              <SimpleTreeView disabledItemsFocusable>
                <TreeItem nodeId="one" label="one" disabled data-testid="one" />
              </SimpleTreeView>,
            );

            act(() => {
              getByTestId('one').focus();
            });
            expect(getByTestId('one')).toHaveVirtualFocus();
            fireEvent.keyDown(getByRole('tree'), { key: ' ' });
            expect(getByTestId('one')).not.to.have.attribute('aria-selected');
          });

          it('should not prevent next node being range selected by keyboard', () => {
            const { getByRole, getByTestId } = render(
              <SimpleTreeView multiSelect disabledItemsFocusable>
                <TreeItem nodeId="one" label="one" disabled data-testid="one" />
                <TreeItem nodeId="two" label="two" data-testid="two" />
                <TreeItem nodeId="three" label="three" data-testid="three" />
                <TreeItem nodeId="four" label="four" data-testid="four" />
              </SimpleTreeView>,
            );

            act(() => {
              getByTestId('one').focus();
            });
            expect(getByTestId('one')).toHaveVirtualFocus();
            fireEvent.keyDown(getByRole('tree'), { key: 'ArrowDown', shiftKey: true });
            expect(getByTestId('one')).to.have.attribute('aria-selected', 'false');
            expect(getByTestId('two')).to.have.attribute('aria-selected', 'true');
            expect(getByTestId('two')).toHaveVirtualFocus();
          });

          it('should prevent range selection by keyboard + arrow down', () => {
            const { getByRole, getByTestId } = render(
              <SimpleTreeView multiSelect disabledItemsFocusable>
                <TreeItem nodeId="one" label="one" data-testid="one" />
                <TreeItem nodeId="two" label="two" disabled data-testid="two" />
              </SimpleTreeView>,
            );

            act(() => {
              getByTestId('one').focus();
            });
            expect(getByTestId('one')).toHaveVirtualFocus();
            fireEvent.keyDown(getByRole('tree'), { key: 'ArrowDown', shiftKey: true });
            expect(getByTestId('one')).to.have.attribute('aria-selected', 'false');
            expect(getByTestId('two')).to.have.attribute('aria-selected', 'false');
            expect(getByTestId('two')).toHaveVirtualFocus();
          });
        });

        describe('`disabledItemsFocusable=false`', () => {
          it('should select the next non disabled node by keyboard + arrow down', () => {
            const { getByRole, getByTestId } = render(
              <SimpleTreeView multiSelect>
                <TreeItem nodeId="one" label="one" data-testid="one" />
                <TreeItem nodeId="two" label="two" disabled data-testid="two" />
                <TreeItem nodeId="three" label="three" data-testid="three" />
              </SimpleTreeView>,
            );

            act(() => {
              getByTestId('one').focus();
            });
            expect(getByTestId('one')).toHaveVirtualFocus();
            fireEvent.keyDown(getByRole('tree'), { key: 'ArrowDown', shiftKey: true });
            expect(getByTestId('one')).to.have.attribute('aria-selected', 'false');
            expect(getByTestId('two')).to.have.attribute('aria-selected', 'false');
            expect(getByTestId('three')).toHaveVirtualFocus();
            expect(getByTestId('one')).to.have.attribute('aria-selected', 'false');
            expect(getByTestId('two')).to.have.attribute('aria-selected', 'false');
            expect(getByTestId('three')).to.have.attribute('aria-selected', 'true');
          });
        });

        it('should prevent range selection by keyboard + space', () => {
          const { getByRole, getByTestId, getByText } = render(
            <SimpleTreeView multiSelect>
              <TreeItem nodeId="one" label="one" data-testid="one" />
              <TreeItem nodeId="two" label="two" data-testid="two" />
              <TreeItem nodeId="three" label="three" disabled data-testid="three" />
              <TreeItem nodeId="four" label="four" data-testid="four" />
              <TreeItem nodeId="five" label="five" data-testid="five" />
            </SimpleTreeView>,
          );
          const tree = getByRole('tree');

          fireEvent.click(getByText('one'));
          act(() => {
            tree.focus();
          });
          for (let i = 0; i < 5; i += 1) {
            fireEvent.keyDown(tree, { key: 'ArrowDown' });
          }
          fireEvent.keyDown(tree, { key: ' ', shiftKey: true });

          expect(getByTestId('one')).to.have.attribute('aria-selected', 'true');
          expect(getByTestId('two')).to.have.attribute('aria-selected', 'true');
          expect(getByTestId('three')).to.have.attribute('aria-selected', 'false');
          expect(getByTestId('four')).to.have.attribute('aria-selected', 'true');
          expect(getByTestId('five')).to.have.attribute('aria-selected', 'true');
        });

        it('should prevent selection by ctrl + a', () => {
          const { getByRole, queryAllByRole } = render(
            <SimpleTreeView multiSelect>
              <TreeItem nodeId="one" label="one" data-testid="one" />
              <TreeItem nodeId="two" label="two" data-testid="two" />
              <TreeItem nodeId="three" label="three" disabled data-testid="three" />
              <TreeItem nodeId="four" label="four" data-testid="four" />
              <TreeItem nodeId="five" label="five" data-testid="five" />
            </SimpleTreeView>,
          );

          act(() => {
            getByRole('tree').focus();
          });

          fireEvent.keyDown(getByRole('tree'), { key: 'a', ctrlKey: true });
          expect(queryAllByRole('treeitem', { selected: true })).to.have.length(4);
        });

        it('should prevent selection by keyboard end', () => {
          const { getByRole, getByTestId } = render(
            <SimpleTreeView multiSelect>
              <TreeItem nodeId="one" label="one" data-testid="one" />
              <TreeItem nodeId="two" label="two" data-testid="two" />
              <TreeItem nodeId="three" label="three" disabled data-testid="three" />
              <TreeItem nodeId="four" label="four" data-testid="four" />
              <TreeItem nodeId="five" label="five" data-testid="five" />
            </SimpleTreeView>,
          );

          act(() => {
            getByRole('tree').focus();
          });
          expect(getByTestId('one')).toHaveVirtualFocus();
          fireEvent.keyDown(getByRole('tree'), {
            key: 'End',
            shiftKey: true,
            ctrlKey: true,
          });

          expect(getByTestId('one')).to.have.attribute('aria-selected', 'true');
          expect(getByTestId('two')).to.have.attribute('aria-selected', 'true');
          expect(getByTestId('three')).to.have.attribute('aria-selected', 'false');
          expect(getByTestId('four')).to.have.attribute('aria-selected', 'true');
          expect(getByTestId('five')).to.have.attribute('aria-selected', 'true');
        });

        it('should prevent selection by keyboard home', () => {
          const { getByRole, getByTestId } = render(
            <SimpleTreeView multiSelect>
              <TreeItem nodeId="one" label="one" data-testid="one" />
              <TreeItem nodeId="two" label="two" data-testid="two" />
              <TreeItem nodeId="three" label="three" disabled data-testid="three" />
              <TreeItem nodeId="four" label="four" data-testid="four" />
              <TreeItem nodeId="five" label="five" data-testid="five" />
            </SimpleTreeView>,
          );

          act(() => {
            getByTestId('five').focus();
          });
          expect(getByTestId('five')).toHaveVirtualFocus();
          fireEvent.keyDown(getByRole('tree'), {
            key: 'Home',
            shiftKey: true,
            ctrlKey: true,
          });

          expect(getByTestId('one')).to.have.attribute('aria-selected', 'true');
          expect(getByTestId('two')).to.have.attribute('aria-selected', 'true');
          expect(getByTestId('three')).to.have.attribute('aria-selected', 'false');
          expect(getByTestId('four')).to.have.attribute('aria-selected', 'true');
          expect(getByTestId('five')).to.have.attribute('aria-selected', 'true');
        });
      });
    });

    describe('focus', () => {
      describe('`disabledItemsFocusable={true}`', () => {
        it('should prevent focus by mouse', () => {
          const focusSpy = spy();
          const { getByText } = render(
            <SimpleTreeView disabledItemsFocusable onNodeFocus={focusSpy}>
              <TreeItem nodeId="one" label="one" data-testid="one" />
              <TreeItem nodeId="two" label="two" disabled data-testid="two" />
            </SimpleTreeView>,
          );

          fireEvent.click(getByText('two'));
          expect(focusSpy.callCount).to.equal(0);
        });

        it('should not prevent programmatic focus', () => {
          const { getByTestId } = render(
            <SimpleTreeView disabledItemsFocusable>
              <TreeItem nodeId="one" label="one" disabled data-testid="one" />
              <TreeItem nodeId="two" label="two" data-testid="two" />
            </SimpleTreeView>,
          );

          act(() => {
            getByTestId('one').focus();
          });
          expect(getByTestId('one')).toHaveVirtualFocus();
        });

        it('should not prevent focus by type-ahead', () => {
          const { getByRole, getByTestId } = render(
            <SimpleTreeView disabledItemsFocusable>
              <TreeItem nodeId="one" label="one" data-testid="one" />
              <TreeItem nodeId="two" label="two" disabled data-testid="two" />
            </SimpleTreeView>,
          );

          act(() => {
            getByRole('tree').focus();
          });
          expect(getByTestId('one')).toHaveVirtualFocus();
          fireEvent.keyDown(getByRole('tree'), { key: 't' });
          expect(getByTestId('two')).toHaveVirtualFocus();
        });

        it('should not prevent focus by arrow keys', () => {
          const { getByRole, getByTestId } = render(
            <SimpleTreeView disabledItemsFocusable>
              <TreeItem nodeId="one" label="one" data-testid="one" />
              <TreeItem nodeId="two" label="two" disabled data-testid="two" />
            </SimpleTreeView>,
          );

          act(() => {
            getByRole('tree').focus();
          });

          expect(getByTestId('one')).toHaveVirtualFocus();

          fireEvent.keyDown(getByRole('tree'), { key: 'ArrowDown' });
          expect(getByTestId('two')).toHaveVirtualFocus();
        });

        it('should be focused on tree focus', () => {
          const { getByRole, getByTestId } = render(
            <SimpleTreeView disabledItemsFocusable>
              <TreeItem nodeId="one" label="one" disabled data-testid="one" />
              <TreeItem nodeId="two" label="two" data-testid="two" />
            </SimpleTreeView>,
          );

          act(() => {
            getByRole('tree').focus();
          });

          expect(getByTestId('one')).toHaveVirtualFocus();
        });
      });

      describe('`disabledItemsFocusable=false`', () => {
        it('should prevent focus by mouse', () => {
          const focusSpy = spy();
          const { getByText } = render(
            <SimpleTreeView onNodeFocus={focusSpy}>
              <TreeItem nodeId="one" label="one" data-testid="one" />
              <TreeItem nodeId="two" label="two" disabled data-testid="two" />
            </SimpleTreeView>,
          );

          fireEvent.click(getByText('two'));
          expect(focusSpy.callCount).to.equal(0);
        });

        it('should prevent programmatic focus', () => {
          const { getByTestId } = render(
            <SimpleTreeView>
              <TreeItem nodeId="one" label="one" disabled data-testid="one" />
              <TreeItem nodeId="two" label="two" data-testid="two" />
            </SimpleTreeView>,
          );

          act(() => {
            getByTestId('one').focus();
          });
          expect(getByTestId('one')).not.toHaveVirtualFocus();
        });

        it('should prevent focus by type-ahead', () => {
          const { getByRole, getByTestId } = render(
            <SimpleTreeView>
              <TreeItem nodeId="one" label="one" data-testid="one" />
              <TreeItem nodeId="two" label="two" disabled data-testid="two" />
            </SimpleTreeView>,
          );

          act(() => {
            getByRole('tree').focus();
          });
          expect(getByTestId('one')).toHaveVirtualFocus();
          fireEvent.keyDown(getByRole('tree'), { key: 't' });
          expect(getByTestId('one')).toHaveVirtualFocus();
        });

        it('should be skipped on navigation with arrow keys', () => {
          const { getByRole, getByTestId } = render(
            <SimpleTreeView>
              <TreeItem nodeId="one" label="one" data-testid="one" />
              <TreeItem nodeId="two" label="two" disabled data-testid="two" />
              <TreeItem nodeId="three" label="three" data-testid="three" />
            </SimpleTreeView>,
          );

          act(() => {
            getByRole('tree').focus();
          });

          expect(getByTestId('one')).toHaveVirtualFocus();

          fireEvent.keyDown(getByRole('tree'), { key: 'ArrowDown' });
          expect(getByTestId('three')).toHaveVirtualFocus();
        });

        it('should not be focused on tree focus', () => {
          const { getByRole, getByTestId } = render(
            <SimpleTreeView>
              <TreeItem nodeId="one" label="one" disabled data-testid="one" />
              <TreeItem nodeId="two" label="two" data-testid="two" />
            </SimpleTreeView>,
          );

          act(() => {
            getByRole('tree').focus();
          });

          expect(getByTestId('two')).toHaveVirtualFocus();
        });
      });
    });

    describe('expansion', () => {
      describe('`disabledItemsFocusable={true}`', () => {
        it('should prevent expansion on enter', () => {
          const { getByRole, getByTestId } = render(
            <SimpleTreeView disabledItemsFocusable>
              <TreeItem nodeId="one" label="one" />
              <TreeItem nodeId="two" label="two" disabled data-testid="two">
                <TreeItem nodeId="three" label="three" />
              </TreeItem>
            </SimpleTreeView>,
          );

          act(() => {
            getByTestId('two').focus();
          });
          expect(getByTestId('two')).toHaveVirtualFocus();
          expect(getByTestId('two')).to.have.attribute('aria-expanded', 'false');
          fireEvent.keyDown(getByRole('tree'), { key: 'Enter' });
          expect(getByTestId('two')).to.have.attribute('aria-expanded', 'false');
        });

        it('should prevent expansion on right arrow', () => {
          const { getByRole, getByTestId } = render(
            <SimpleTreeView disabledItemsFocusable>
              <TreeItem nodeId="one" label="one" />
              <TreeItem nodeId="two" label="two" disabled data-testid="two">
                <TreeItem nodeId="three" label="three" />
              </TreeItem>
            </SimpleTreeView>,
          );

          act(() => {
            getByTestId('two').focus();
          });
          expect(getByTestId('two')).toHaveVirtualFocus();
          expect(getByTestId('two')).to.have.attribute('aria-expanded', 'false');
          fireEvent.keyDown(getByRole('tree'), { key: 'ArrowRight' });
          expect(getByTestId('two')).to.have.attribute('aria-expanded', 'false');
        });

        it('should prevent collapse on left arrow', () => {
          const { getByRole, getByTestId } = render(
            <SimpleTreeView defaultExpandedNodes={['two']} disabledItemsFocusable>
              <TreeItem nodeId="one" label="one" />
              <TreeItem nodeId="two" label="two" disabled data-testid="two">
                <TreeItem nodeId="three" label="three" />
              </TreeItem>
            </SimpleTreeView>,
          );

          act(() => {
            getByTestId('two').focus();
          });
          expect(getByTestId('two')).toHaveVirtualFocus();
          expect(getByTestId('two')).to.have.attribute('aria-expanded', 'true');
          fireEvent.keyDown(getByRole('tree'), { key: 'ArrowLeft' });
          expect(getByTestId('two')).to.have.attribute('aria-expanded', 'true');
        });
      });

      it('should prevent expansion on click', () => {
        const { getByText, getByTestId } = render(
          <SimpleTreeView>
            <TreeItem nodeId="one" label="one" disabled data-testid="one">
              <TreeItem nodeId="two" label="two" />
            </TreeItem>
          </SimpleTreeView>,
        );

        fireEvent.click(getByText('one'));
        expect(getByTestId('one')).to.have.attribute('aria-expanded', 'false');
      });
    });

    describe('event bindings', () => {
      it('should not prevent onClick being fired', () => {
        const handleClick = spy();

        const { getByText } = render(
          <SimpleTreeView>
            <TreeItem nodeId="test" label="test" disabled onClick={handleClick} />
          </SimpleTreeView>,
        );

        fireEvent.click(getByText('test'));

        expect(handleClick.callCount).to.equal(1);
      });
    });

    it('should disable child items when parent item is disabled', () => {
      const { getByTestId } = render(
        <SimpleTreeView defaultExpandedNodes={['one']}>
          <TreeItem nodeId="one" label="one" disabled data-testid="one">
            <TreeItem nodeId="two" label="two" data-testid="two" />
            <TreeItem nodeId="three" label="three" data-testid="three" />
          </TreeItem>
        </SimpleTreeView>,
      );

      expect(getByTestId('one')).to.have.attribute('aria-disabled', 'true');
      expect(getByTestId('two')).to.have.attribute('aria-disabled', 'true');
      expect(getByTestId('three')).to.have.attribute('aria-disabled', 'true');
    });
  });

  describe('content customisation', () => {
    it('should allow a custom ContentComponent', () => {
      const mockContent = React.forwardRef((props: {}, ref: React.Ref<HTMLDivElement>) => (
        <div ref={ref}>MOCK CONTENT COMPONENT</div>
      ));
      const { container } = render(
        <SimpleTreeView>
          <TreeItem nodeId="one" ContentComponent={mockContent as any} />
        </SimpleTreeView>,
      );
      expect(container.textContent).to.equal('MOCK CONTENT COMPONENT');
    });

    it('should allow props to be passed to a custom ContentComponent', () => {
      const mockContent = React.forwardRef((props: any, ref: React.Ref<HTMLDivElement>) => (
        <div ref={ref}>{props.customProp}</div>
      ));
      const { container } = render(
        <SimpleTreeView>
          <TreeItem
            nodeId="one"
            ContentComponent={mockContent as any}
            ContentProps={{ customProp: 'ABCDEF' } as any}
          />
        </SimpleTreeView>,
      );
      expect(container.textContent).to.equal('ABCDEF');
    });
  });

  it('should be able to type in an child input', () => {
    const { getByRole } = render(
      <SimpleTreeView defaultExpandedNodes={['one']}>
        <TreeItem nodeId="one" label="one" data-testid="one">
          <TreeItem
            nodeId="two"
            label={
              <div>
                <input type="text" />
              </div>
            }
            data-testid="two"
          />
        </TreeItem>
      </SimpleTreeView>,
    );
    const input = getByRole('textbox');
    const keydownEvent = createEvent.keyDown(input, {
      key: 'a',
    });

    const handlePreventDefault = spy();
    keydownEvent.preventDefault = handlePreventDefault;
    fireEvent(input, keydownEvent);
    expect(handlePreventDefault.callCount).to.equal(0);
  });

  it('should not focus steal', () => {
    let setActiveItemMounted;
    // a TreeItem whose mounted state we can control with `setActiveItemMounted`
    function ControlledTreeItem(props) {
      const [mounted, setMounted] = React.useState(true);
      setActiveItemMounted = setMounted;

      if (!mounted) {
        return null;
      }
      return <TreeItem {...props} />;
    }
    const { getByText, getByTestId, getByRole } = render(
      <React.Fragment>
        <button type="button">Some focusable element</button>
        <SimpleTreeView id="tree">
          <TreeItem nodeId="one" label="one" data-testid="one" />
          <ControlledTreeItem nodeId="two" label="two" data-testid="two" />
        </SimpleTreeView>
      </React.Fragment>,
    );

    fireEvent.click(getByText('two'));
    act(() => {
      getByRole('tree').focus();
    });

    expect(getByTestId('two')).toHaveVirtualFocus();

    act(() => {
      getByRole('button').focus();
    });

    expect(getByRole('button')).toHaveFocus();

    act(() => {
      setActiveItemMounted(false);
    });
    act(() => {
      setActiveItemMounted(true);
    });

    expect(getByRole('button')).toHaveFocus();
  });
});

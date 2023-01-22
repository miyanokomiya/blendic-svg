# Change Log
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

## [Unreleased]

## [0.18.1] - 2023-01-22
### Added
- Add new node to get the length of SVG path
- Add new node to get the point at the length of SVG path
- Add new node to transform SVG path
- Add new node to reverse SVG path
- Add new node to apply a transform to a vector
- Implement loop structure for the animation graph

## [0.18.0] - 2023-01-01
### Breaking
- Stop multiple armature support

### Added
- Scroll to the selected tree node automatically
- Expand tree node when it's selected

### Refactor
- Remove SASS dependency

## [0.17.5] - 2022-12-05
### Added
- Make animated SVG size flexible
- Add new config UI for choosing interpolation type
- Make edge connecting more explicit
- Keep individual viewport on the animation graph cnavas
- Add search field to new graph new popup menu
- Add preview UI for animated SVG into the setting dialog

### Fixed
- Fix: Disable SMIL interpolation like CSS animation
- Fix: Inaccurate animation duration

## [0.17.4] - 2022-07-30
### Added
- Add new feature to modify bezier controls symmetrically
- Add new feature to modify bezier controls synchronically
- Add rectangle select feature for the keyframe graph canvas
- Enable to use custom nodes that are independent from current custom node
- Enable to modify edge connections by `ctrl` + dragging
- Convert selected graph nodes to custom graph

### Fixed
- Fix: Moving bezier controls slows down the cnavas
- Fix: Some nodes for custom graph can't be created
- Fix: Custom node has invalid generics structure

## [0.17.3] - 2022-07-17
### Added
- Add new feature to paste `d` of `<path>` text as graph nodes
- Inherit current input value as much as possible

### Fixed
- Fix: `animate` tags in exported SVG didn't work due to lack of `id`

### Refactor
- refactor: Introduce state pattern into the timeline canvas

## [0.17.2] - 2022-07-10
### Added
- Reduce animated SVG file size by omitting static attributes from animated tags and styles
- Enable to modify exporting settings for animated SVG
- Add dark theme

### Fixed
- Fix a logic to symmetrize bones with consraints

## [0.17.1] - 2022-06-21
### Added
- Add bone pickers at each bone selection field

### Fixed
- Fix invalid scale modification in the edit mode and the pose mode
- Fix invalid `viewBox` emulation in animated SVG
- Fix invalid whole SVG tree in animated SVG

## [0.17.0] - 2022-06-10
### Added
- Add new graph node to clip shapes
- Disconnect node edges by `ctrl + right-dragging`
- Reduce exported file size of animated SVG
- Implement copy & paste in the armature edit mode

### Fixed
- Fix invalid IK with more than 2 chains
- Use class selector for animations instead of id selector

### Changed
- refactor: Introduce state pattern into the app canvas

## [0.16.0] - 2022-04-24
### Added
- Add new graph node to get a bone summary
- Show new node suggestions during modifying output edge
- Insert new node among two nodes by clicking the edge
- Add new node to be connected when input edge is release at empty space

### Changed
- Use native clipborad API in the animation graph canvas

### Refactor
- Rewrite animation graph mode as state pattern

## [0.15.0] - 2022-03-11
### Added
- Add new graph node to clone a object with new parent group
- Add custom graph

## [0.14.0] - 2022-02-23
### Added
- Add new graph if new node is added during no graph selected.
- Add reroute node.
- Add new feature to export animated SVG.  
Both CSS and SMIL are used.  
Graph animation can be exported with this SVG.

### Fixed
- Enable keyframe series of constraints to be selected in the timeline panel.
- Invalid last selected bone in edit mode #254

## [0.13.0] - 2021-10-22
### Changed
- Save and restore selected state of keyframes. #247

## [0.12.0] - 2021-10-19
### Changed
- Save and restore selected state of some entities.  
Selected state of keyframes can not be saved because of technical issues.
- Save and restore current canvas mode.

## [0.11.0] - 2021-10-18
### Changed
- Replace the history system to avoid using function closure and then restore the state by using reducers and actions.

### Fixed
- The operation to shift-click a bone toggle its selected state correctly in edit mode.

## [0.10.0] - 2021-10-12
### Changed
- [breaking] Normalize all entities and drop backward compatibility.

### Added
- Add CHANGELOG.

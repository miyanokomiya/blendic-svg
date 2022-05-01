# Change Log
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

## [Unreleased]
### Added
- Disconnect node edges by `ctrl + right-dragging`

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

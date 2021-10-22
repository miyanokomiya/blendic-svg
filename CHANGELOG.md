# Change Log
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

## [Unreleased]

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

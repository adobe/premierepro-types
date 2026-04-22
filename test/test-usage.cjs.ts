/*
 * Copyright 2026 Adobe. All rights reserved.
 *
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import type {
  AudioTrack,
  Color,
  FolderItem,
  FrameRate,
  Guid,
  PointF,
  premierepro,
  Project,
  ProjectItem,
  RectF,
  Sequence,
  SequenceSettings,
  TickTime,
  VideoClipTrackItem,
  VideoTrack,
} from "../src/premierepro";

// Simulated premierepro module for type checking
declare const premierepro: premierepro;

/*
 * Callable object types (Color, Guid, etc.) are type-only in `.d.ts` files — there is
 * no exported JS value named `Color` at compile time. In the host, those values
 * exist at runtime. Declare local stand-ins so we can exercise call signatures
 * and properties without `Color only refers to a type` errors.
 */
/* eslint-disable @typescript-eslint/naming-convention */
declare const Color: Color;
declare const FrameRate: FrameRate;
declare const Guid: Guid;
declare const PointF: PointF;
declare const RectF: RectF;
declare const TickTime: TickTime;
/* eslint-enable @typescript-eslint/naming-convention */

// Test: Project methods
async function testProject(project: Project): Promise<void> {
  const name: string = project.name;
  const path: string = project.path;
  const guid: Guid = project.guid;

  const rootItem: FolderItem = await project.getRootItem();
  const sequences: Sequence[] = await project.getSequences();
  const activeSequence: Sequence | null = await project.getActiveSequence();

  // Import files
  const imported: boolean = await project.importFiles(["/path/to/file.mp4"], true /* suppressUI */);

  // Transaction
  project.executeTransaction(async () => {
    // Do something
  }, "My Undo String");

  // Save
  await project.save();
  await project.saveAs("/new/path.prproj");
}

// Test: Sequence methods
async function testSequence(sequence: Sequence): Promise<void> {
  const name: string = sequence.name;
  const guid: Guid = sequence.guid;

  const videoTrackCount: number = await sequence.getVideoTrackCount();
  const videoTracks: VideoTrack[] = [];
  for (let i = 0; i < videoTrackCount; i++) {
    videoTracks.push(await sequence.getVideoTrack(i));
  }
  const audioTrackCount: number = await sequence.getAudioTrackCount();
  const audioTracks: AudioTrack[] = [];
  for (let i = 0; i < audioTrackCount; i++) {
    audioTracks.push(await sequence.getAudioTrack(i));
  }

  const position: TickTime = await sequence.getPlayerPosition();
  const duration: TickTime = await sequence.getEndTime();

  const sequenceSettings: SequenceSettings = await sequence.getSettings();
  const frameRate: FrameRate = sequenceSettings.getVideoFrameRate();

  const frameSize: RectF = await sequenceSettings.getVideoFrameRect();

  console.log(`Sequence: ${name}`);
  console.log(`Duration: ${duration.seconds}s at ${frameRate.value}fps`);
  console.log(`Player position: ${position.seconds}s`);
  console.log(`Size: ${frameSize.width}x${frameSize.height}`);
}

// Test: Track methods
async function testTrack(track: VideoTrack): Promise<void> {
  const name: string = track.name;

  const muted: boolean = await track.isMuted();

  const clips: VideoClipTrackItem[] = track.getTrackItems(
    premierepro.Constants.TrackItemType.CLIP,
    false
  );
}

// Test: Track item methods
async function testTrackItem(clip: VideoClipTrackItem): Promise<void> {
  const guid: Guid = await clip.getMediaType();
  const name: string = await clip.getName();

  const startTime: TickTime = await clip.getStartTime();
  const endTime: TickTime = await clip.getEndTime();
  const duration: TickTime = await clip.getDuration();
  const inPoint: TickTime = await clip.getInPoint();
  const outPoint: TickTime = await clip.getOutPoint();

  const projectItem: ProjectItem = await clip.getProjectItem();

  const speed: number = await clip.getSpeed();

  console.log(`Clip: ${name}`);
  console.log(`Start: ${startTime.seconds}s, End: ${endTime.seconds}s`);
  console.log(`Speed: ${speed}x`);
}

// Test: callable object types + static factories (see premierepro.d.ts)
function testBasicTypes(): void {
  const color = Color(255, 128, 0, 255);
  const frameRate = premierepro.FrameRate.createWithValue(24000 / 1001);
  const guid = Guid();
  const point = PointF(0.5, 0.5);
  const rect = RectF();
  rect.width = 100;
  rect.height = 100;
  const tickTime = premierepro.TickTime.createWithTicks("254016000000");
  const tickTimeAlt = TickTime();

  console.log(`Color: rgba(${color.red}, ${color.green}, ${color.blue}, ${color.alpha})`);
  console.log(`FrameRate: ${frameRate.value}fps`);
  console.log(`Guid: ${guid.toString()}`);
  console.log(`Point: (${point.x}, ${point.y})`);
  console.log(`Rect: ${rect.width}x${rect.height}`);
  console.log(`TickTime: ${tickTime.seconds}s, alt ticks ${tickTimeAlt.seconds}`);
}

// Test: Constants via premierepro module
function testConstants(): void {
  // Access constants through the premierepro module at runtime
  const mediaType = premierepro.Constants.MediaType.VIDEO;
  const colorLabel = premierepro.Constants.ProjectItemColorLabel.BLUE;
  const interpolation = premierepro.Constants.InterpolationMode.BEZIER;
  const exportType = premierepro.Constants.ExportType.IMMEDIATELY;
  const markerColor = premierepro.Constants.MarkerColor.GREEN;

  console.log(`Media type: ${mediaType}`);
  console.log(`Color label: ${colorLabel}`);
  console.log(`Interpolation: ${interpolation}`);
  console.log(`Export type: ${exportType}`);
  console.log(`Marker color: ${markerColor}`);
}

// Test: Export
async function testExport(sequence: Sequence): Promise<void> {
  const encoder = premierepro.EncoderManager.getManager();

  await encoder.exportSequence(
    sequence,
    premierepro.Constants.ExportType.IMMEDIATELY,
    "/output/path.mp4",
    "/preset/path.epr"
  );
}

// Main test function
async function main(): Promise<void> {
  testBasicTypes();
  testConstants();

  const project = await premierepro.Project.getActiveProject();
  if (project) {
    await testProject(project);

    const sequence = await project.getActiveSequence();
    if (sequence) {
      await testSequence(sequence);
      await testExport(sequence);

      const videoTrackCount: number = await sequence.getVideoTrackCount();

      if (videoTrackCount > 0) {
        const videoTrack = await sequence.getVideoTrack(0);
        if (videoTrack == null) {
          return;
        }

        const clips = videoTrack.getTrackItems(premierepro.Constants.TrackItemType.CLIP, false);
        for (const clip of clips) {
          if (clip !== null) {
            await testTrackItem(clip);
          }
        }
      }
    }
  }
}

// Type-only export to make this a module
export {};

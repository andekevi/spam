import Controller from '@ember/controller';
import { computed } from '@ember/object';
import System from 'spam/models/system/object';
import OperatingSystem from 'spam/models/operating-system/object';
import MemoryUnit from 'spam/models/memory-unit/object';
import Instruction from 'spam/models/instruction/object';
import InstructionGenerator from 'spam/utils/instruction-generator';
import MemoryFrame from 'spam/models/memory-frame/object';
import Process from 'spam/models/process/object';

export default Controller.extend({
	_system: null,
	system: computed('_system', function() {
		return this.get('_system');
	}),
	_pageFrameSize: 256,
	pageFrameSize: computed('_pageFrameSize', 'system.pageFrameSize', {
		get() {
			return this.get('_pageFrameSize');
		},
		set(key, val) {
			this.set('_pageFrameSize', val);
			return this.get('_pageFrameSize');
		}
	}),
	_memorySize: 8192,
	memorySize: computed('_memorySize', 'system.memorySize', {
		get() {
			return this.get('_memorySize');
		},
		set(key, val) {
			this.set('_memorySize', val);
			return this.get('_memorySize');
		}
	}),
	_numberOfProcesses: 5,
	numberOfProcesses: computed('_numberOfProcesses', {
		get() {
			return this.get('_numberOfProcesses');
		},
		set(key, val) {
			this.set('_numberOfProcesses', val);
			return this.get('_numberOfProcesses');
		}
	}),
	memorySizeBits: computed('memorySize', {
		get() {
			return Math.log2(this.get('memorySize'));
		},
		set(key, val) {
			this.set('memorySize', Math.pow(2, val));
			return Math.log2(this.get('memorySize'));
		}
	}),
	pageFrameSizeBits: computed('pageFrameSize', {
		get() {
			return Math.log2(this.get('pageFrameSize'));
		},
		set(key, val) {
			this.set('pageFrameSize', Math.pow(2, val));
			return Math.log2(this.get('pageFrameSize'));
		}
	}),
	instructionCounter: 0,
	_instructions: null,
	instructions: computed('_instructions', {
		get() {
			return this.get('_instructions');
		},
		set(key, val) {
			this.set('_instructions', val);
			return this.get('_instructions')
		}
	}),
	actions: {
		loadConfig() {
			this.set('instructionCounter', 0);
			let frameCount = Number(this.get('memorySize')) / Number(this.get('pageFrameSize'));

			let system = System.create({
				frameSize: Number(this.get('pageFrameSize')),
				memorySize: Number(this.get('memorySize')),
			});

			let operatingSystem = OperatingSystem.create({
				pageSize: system.get('frameSize'),
				processControlList: new Array(frameCount),
				currentPageTable: null,
				system: system // reference to ask system to run commands
			});

			// Init PCB
			for(let i = 0; i < operatingSystem.get('processControlList').length; i++) {
				operatingSystem.get('processControlList')[i] = Process.create({id: null});
			}

			let memoryUnit = MemoryUnit.create({
				frameSize: system.get('frameSize'),
				frameList: new Array(frameCount),
				swapList: new Array(frameCount * 2),
				system: system // reference to ask system to run commands
			});

			// Init Frames
			for(let i = 0; i < memoryUnit.get('frameList').length; i++) {
				memoryUnit.get('frameList')[i] = MemoryFrame.create({id: i, processId: null});
			}

			// Init Swap Frames
			for(let i = 0; i < memoryUnit.get('swapList').length; i++) {
				memoryUnit.get('swapList')[i] = MemoryFrame.create({id: i, processId: null});
			}

			system.set('operatingSystem', operatingSystem);
			system.set('memoryUnit', memoryUnit);

			if(this.get('instructions')) {
				let instructionList = this.get('instructions').split("\n").map((instruction) => {
					let instructionParts = instruction.split(" ");

					if(instructionParts.length === 2) {
						return Instruction.create({
							processId: Number(instructionParts[0]),
							codeSize: Number(instructionParts[1])
						});
					} else if(instructionParts.length === 3) {
						return Instruction.create({
							processId: Number(instructionParts[0]),
							codeSize: Number(instructionParts[1]),
							dataSize: Number(instructionParts[2])
						});
					}
				});

				system.set('instructions', instructionList);
			}

			this.set('_system', system);
		},
		generateInstructions(pageFrameSize, memorySize, numberOfProcesses) {
			let instructions = InstructionGenerator.generate(pageFrameSize, memorySize, numberOfProcesses);
			this.set('instructions', instructions);
		},
		loadInstruction(counter) {
			let system = this.get('system');
			system.loadInstruction(counter);

			this.set('instructionCounter', counter + 1);
		}
	}
});

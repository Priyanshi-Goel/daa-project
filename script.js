document.addEventListener('DOMContentLoaded', () => {

            // --- Constants and Global State ---
            const ANIMATION_DELAY_MS = 600; // Speed of animations
            let isAnimating = false; // Flag to prevent concurrent animations

            // --- DOM Elements ---
            const valueInput = document.getElementById('value-input');
            const insertBtn = document.getElementById('insert-btn');
            const deleteMinBtn = document.getElementById('delete-min-btn');
            const resetBtn = document.getElementById('reset-btn');
            const arrayDisplay = document.getElementById('array-display');
            const heapTreeSvg = document.getElementById('heap-tree-svg');
            const logArea = document.getElementById('log-area');

            // --- MinHeap Class ---
            class MinHeap {
                constructor() {
                    this.heap = [];
                }

                get size() {
                    return this.heap.length;
                }

                isEmpty() {
                    return this.heap.length === 0;
                }

                getParentIndex(i) { return Math.floor((i - 1) / 2); }
                getLeftChildIndex(i) { return 2 * i + 1; }
                getRightChildIndex(i) { return 2 * i + 2; }

                hasParent(i) { return this.getParentIndex(i) >= 0; }
                hasLeftChild(i) { return this.getLeftChildIndex(i) < this.heap.length; }
                hasRightChild(i) { return this.getRightChildIndex(i) < this.heap.length; }

                getParent(i) { return this.heap[this.getParentIndex(i)]; }
                getLeftChild(i) { return this.heap[this.getLeftChildIndex(i)]; }
                getRightChild(i) { return this.heap[this.getRightChildIndex(i)]; }

                swap(i, j) {
                    [this.heap[i], this.heap[j]] = [this.heap[j], this.heap[i]];
                }

                async insert(item) {
                    this.heap.push(item);
                    await this.heapifyUp(this.heap.length - 1);
                }

                async deleteMin() {
                    if (this.isEmpty()) {
                        log('Heap is empty!', 'error');
                        return null;
                    }
                    if (this.heap.length === 1) {
                        const removed = this.heap.pop();
                        await animateRemove(0, removed);
                        log(`Removed ${removed}. Heap is now empty.`, 'success');
                        return removed;
                    }

                    const min = this.heap[0];
                    const lastElement = this.heap.pop();
                    
                    await animateRemove(0, min); // Animate removing the min
                    log(`Removing min element (${min}) from root.`, 'info');
                    
                    this.heap[0] = lastElement;
                    await animateSwap(this.heap.length, 0, lastElement); // Animate moving last to root
                    log(`Moved last element (${lastElement}) to root.`, 'info');
                    
                    await this.heapifyDown(0);
                    log(`Successfully deleted min element: ${min}.`, 'success');
                    return min;
                }

                async heapifyUp(index) {
                    let currentIndex = index;
                    log(`Starting heapifyUp for ${this.heap[currentIndex]} at index ${currentIndex}.`, 'step');
                    
                    while (this.hasParent(currentIndex) && this.getParent(currentIndex) > this.heap[currentIndex]) {
                        const parentIndex = this.getParentIndex(currentIndex);
                        log(`Comparing ${this.heap[currentIndex]} (current) with ${this.getParent(currentIndex)} (parent at index ${parentIndex}).`, 'step');
                        await animateCompare(currentIndex, parentIndex);

                        this.swap(currentIndex, parentIndex);
                        log(`Swapped ${this.heap[parentIndex]} and ${this.heap[currentIndex]} (at indices ${currentIndex} and ${parentIndex}).`, 'step');
                        await animateSwap(currentIndex, parentIndex);
                        
                        currentIndex = parentIndex;
                    }
                    log(`HeapifyUp complete. ${this.heap[currentIndex]} is in its correct position.`, 'success');
                }

                async heapifyDown(index) {
                    let currentIndex = index;
                    log(`Starting heapifyDown for ${this.heap[currentIndex]} at index ${currentIndex}.`, 'step');

                    while (this.hasLeftChild(currentIndex)) {
                        let smallerChildIndex = this.getLeftChildIndex(currentIndex);
                        
                        if (this.hasRightChild(currentIndex) && this.getRightChild(currentIndex) < this.getLeftChild(currentIndex)) {
                            smallerChildIndex = this.getRightChildIndex(currentIndex);
                        }

                        log(`Comparing ${this.heap[currentIndex]} (current) with its smallest child ${this.heap[smallerChildIndex]} (at index ${smallerChildIndex}).`, 'step');
                        await animateCompare(currentIndex, smallerChildIndex);

                        if (this.heap[currentIndex] < this.heap[smallerChildIndex]) {
                            log(`${this.heap[currentIndex]} is smaller than its child. HeapifyDown complete.`, 'success');
                            break; // Element is in its correct place
                        } else {
                            this.swap(currentIndex, smallerChildIndex);
                            log(`Swapped ${this.heap[currentIndex]} and ${this.heap[smallerChildIndex]} (at indices ${currentIndex} and ${smallerChildIndex}).`, 'step');
                            await animateSwap(currentIndex, smallerChildIndex);
                            currentIndex = smallerChildIndex;
                        }
                    }
                    log(`HeapifyDown complete. ${this.heap[currentIndex]} is in its correct position.`, 'success');
                }
            }

            const minHeap = new MinHeap();

            // --- Helper Functions ---

            /**
             * Asynchronous sleep function.
             * @param {number} ms - Milliseconds to sleep.
             */
            function sleep(ms) {
                return new Promise(resolve => setTimeout(resolve, ms));
            }

            /**
             * Adds a message to the log area.
             * @param {string} message - The text to log.
             * @param {string} type - 'info', 'success', 'error', 'step'.
             */
            function log(message, type = 'info') {
                const p = document.createElement('p');
                p.className = `log-${type}`;
                p.textContent = `> ${message}`;
                logArea.appendChild(p);
                logArea.scrollTop = logArea.scrollHeight; // Auto-scroll
            }

            /**
             * Clears all highlights from array and SVG nodes.
             */
            function clearHighlights() {
                document.querySelectorAll('.array-element').forEach(el => {
                    el.classList.remove('highlight-current', 'highlight-compare', 'highlight-swap', 'highlight-removed');
                });
                document.querySelectorAll('.tree-node-group').forEach(group => {
                    group.classList.remove('svg-highlight-current', 'svg-highlight-compare', 'svg-highlight-swap', 'svg-highlight-removed');
                });
            }

            /**
             * Disables/enables controls during animation.
             */
            function setControlsDisabled(disabled) {
                insertBtn.disabled = disabled;
                deleteMinBtn.disabled = disabled;
                resetBtn.disabled = disabled;
                valueInput.disabled = disabled;
            }

            // --- Animation Functions ---

            /**
             * Animates a comparison between two nodes.
             * @param {number} index1 - First node index.
             * @param {number} index2 - Second node index.
             */
            async function animateCompare(index1, index2) {
                clearHighlights();
                getArrayElement(index1)?.classList.add('highlight-current');
                getArrayElement(index2)?.classList.add('highlight-compare');
                getSvgNode(index1)?.classList.add('svg-highlight-current');
                getSvgNode(index2)?.classList.add('svg-highlight-compare');
                await sleep(ANIMATION_DELAY_MS);
                clearHighlights();
            }

            /**
             * Animates a swap between two nodes.
             * @param {number} index1 - First node index.
             * @param {number} index2 - Second node index.
             */
            async function animateSwap(index1, index2) {
                clearHighlights();
                getArrayElement(index1)?.classList.add('highlight-swap');
                getArrayElement(index2)?.classList.add('highlight-swap');
                getSvgNode(index1)?.classList.add('svg-highlight-swap');
                getSvgNode(index2)?.classList.add('svg-highlight-swap');
                await sleep(ANIMATION_DELAY_MS);
                renderVisuals(); // Re-render after swap to show new positions
                await sleep(ANIMATION_DELAY_MS / 2); // Short pause for visual update
                clearHighlights();
            }
            
            /**
             * Animates removing an element (e.g., the min element).
             * @param {number} index - Index of the element to remove.
             * @param {number} value - The value being removed (for logging).
             */
            async function animateRemove(index, value) {
                clearHighlights();
                getArrayElement(index)?.classList.add('highlight-removed');
                getSvgNode(index)?.classList.add('svg-highlight-removed');
                log(`Highlighting element to be removed: ${value} at index ${index}.`, 'step');
                await sleep(ANIMATION_DELAY_MS);
                clearHighlights();
                renderVisuals(); // Re-render to reflect removal
                await sleep(ANIMATION_DELAY_MS / 2);
            }

            // --- Rendering Functions ---

            /**
             * Gets an array element by its index.
             * @param {number} index - The index in the array.
             * @returns {HTMLElement|null} The array element div.
             */
            function getArrayElement(index) {
                return arrayDisplay.querySelector(`.array-element[data-index="${index}"]`);
            }

            /**
             * Gets an SVG node group by its index.
             * @param {number} index - The index in the heap array.
             * @returns {SVGGElement|null} The SVG group element for the node.
             */
            function getSvgNode(index) {
                return heapTreeSvg.querySelector(`.tree-node-group[data-index="${index}"]`);
            }

            /**
             * Renders the array representation of the heap.
             */
            function renderArray() {
                arrayDisplay.innerHTML = '';
                if (minHeap.isEmpty()) {
                    arrayDisplay.innerHTML = '<div class="array-element empty">Empty</div>';
                    return;
                }

                minHeap.heap.forEach((item, index) => {
                    const el = document.createElement('div');
                    el.className = 'array-element';
                    el.dataset.index = index;
                    el.textContent = item;

                    const indexLabel = document.createElement('span');
                    indexLabel.className = 'array-index';
                    indexLabel.textContent = index;
                    el.appendChild(indexLabel);

                    arrayDisplay.appendChild(el);
                });
            }

            /**
             * Renders the binary tree representation of the heap using SVG.
             */
            function renderTree() {
                heapTreeSvg.innerHTML = ''; // Clear previous tree
                if (minHeap.isEmpty()) {
                    return;
                }

                // Calculate tree layout parameters
                const nodeRadius = 25;
                const verticalSpacing = 70;
                const horizontalSpacingFactor = 2.5; // Controls horizontal spread

                const levels = Math.ceil(Math.log2(minHeap.size + 1));
                const maxWidth = Math.pow(2, levels - 1) * nodeRadius * horizontalSpacingFactor * 2;
                heapTreeSvg.style.minWidth = `${Math.max(500, maxWidth)}px`;
                heapTreeSvg.setAttribute('viewBox', `0 0 ${Math.max(500, maxWidth)} ${levels * verticalSpacing + nodeRadius * 2}`);
                heapTreeSvg.setAttribute('width', '100%');
                heapTreeSvg.setAttribute('height', '100%');


                // Store node positions to draw edges later
                const nodePositions = new Map(); // Map: index -> {x, y}

                minHeap.heap.forEach((item, index) => {
                    const level = Math.floor(Math.log2(index + 1));
                    const nodesInLevel = Math.pow(2, level);
                    const positionInLevel = index - (nodesInLevel - 1); // 0-indexed position within its level
                    
                    // Center the tree horizontally
                    const levelWidth = nodesInLevel * nodeRadius * horizontalSpacingFactor * 2;
                    const startX = (heapTreeSvg.clientWidth - levelWidth) / 2 || 0; // Fallback for initial render
                    
                    // Calculate x and y for the current node
                    // x position depends on its position within the level and overall tree width
                    const x = (positionInLevel * (nodeRadius * horizontalSpacingFactor * 2)) + nodeRadius + (maxWidth / 2) - (levelWidth / 2);
                    const y = (level * verticalSpacing) + nodeRadius + 20; // +20 for some top padding

                    nodePositions.set(index, { x, y });

                    // Draw edges first (for parent to child)
                    if (index > 0) {
                        const parentIndex = minHeap.getParentIndex(index);
                        const parentPos = nodePositions.get(parentIndex);
                        if (parentPos) {
                            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                            line.setAttribute('x1', parentPos.x);
                            line.setAttribute('y1', parentPos.y + nodeRadius); // Start from bottom of parent circle
                            line.setAttribute('x2', x);
                            line.setAttribute('y2', y - nodeRadius); // End at top of child circle
                            line.classList.add('tree-edge');
                            heapTreeSvg.appendChild(line);
                        }
                    }

                    // Draw node circle and text
                    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                    group.classList.add('tree-node-group');
                    group.dataset.index = index; // Store index for easy lookup

                    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                    circle.setAttribute('cx', x);
                    circle.setAttribute('cy', y);
                    circle.setAttribute('r', nodeRadius);
                    circle.classList.add('tree-node-circle');
                    
                    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                    text.setAttribute('x', x);
                    text.setAttribute('y', y + 5); // Adjust for vertical centering of text
                    text.setAttribute('text-anchor', 'middle');
                    text.classList.add('tree-node-text');
                    text.textContent = item;

                    group.appendChild(circle);
                    group.appendChild(text);
                    heapTreeSvg.appendChild(group);
                });
            }
            
            /**
             * Renders both array and tree visualizations.
             */
            function renderVisuals() {
                renderArray();
                renderTree();
            }

            // --- Event Handlers ---

            async function handleInsert() {
                if (isAnimating) return;

                const value = parseInt(valueInput.value);
                if (isNaN(value) || value < 1 || value > 999) {
                    log('Please enter a valid number between 1 and 999.', 'error');
                    return;
                }

                isAnimating = true;
                setControlsDisabled(true);
                logArea.innerHTML = ''; // Clear logs for new operation
                clearHighlights();

                log(`Attempting to insert ${value}...`, 'info');
                await minHeap.insert(value);
                
                log(`Value ${value} inserted successfully.`, 'success');
                renderVisuals(); // Final render after animation completes
                valueInput.value = '';
                valueInput.focus();
                isAnimating = false;
                setControlsDisabled(false);
            }

            async function handleDeleteMin() {
                if (isAnimating) return;
                if (minHeap.isEmpty()) {
                    log('Heap is already empty!', 'error');
                    return;
                }

                isAnimating = true;
                setControlsDisabled(true);
                logArea.innerHTML = ''; // Clear logs for new operation
                clearHighlights();

                log('Attempting to delete minimum element...', 'info');
                await minHeap.deleteMin();

                renderVisuals(); // Final render after animation completes
                valueInput.value = '';
                isAnimating = false;
                setControlsDisabled(false);
            }

            function handleReset() {
                if (isAnimating) return; // Don't reset mid-animation
                minHeap.heap = []; // Clear the heap array
                logArea.innerHTML = '';
                log('Heap has been reset.', 'info');
                renderVisuals();
                valueInput.value = '';
                valueInput.focus();
                setControlsDisabled(false); // Ensure controls are enabled after reset
            }

            // --- Event Listeners ---
            insertBtn.addEventListener('click', handleInsert);
            deleteMinBtn.addEventListener('click', handleDeleteMin);
            resetBtn.addEventListener('click', handleReset);

            valueInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    handleInsert();
                }
            });

            // --- Initial Setup ---
            renderVisuals(); // Draw empty heap initially
        });
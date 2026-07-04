# Qubik - Professional Timer for Speedcubing

## 1. General project description

Qubik Timer is a web application designed for formal speedcubing practice under conditions equivalent to official competition environments. Speedcubing consists of solving a Rubik’s Cube in the shortest possible time using official scrambles while recording each attempt in order to analyze performance through regulated statistical metrics.

<p align="center">
  <img src="./src/multimedia/Speedcubing.gif" width="300">
  <img src="./src/multimedia/Aplicacion.png" width="341">
</p>

The application reproduces this complete competitive workflow within a digital environment. It generates valid scrambles, measures the time of each solve using controlled activation logic, records every solution in persistent storage, and calculates official statistics that update in real time. Each new record immediately impacts the visible averages without requiring the application to reload. The system is designed not only as a timer, but as a comprehensive environment for training and performance analysis.

---

## 2. Technologies used and modularization

Qubik Timer is developed entirely in Vanilla JavaScript (ES Modules), without frameworks or external UI libraries. This decision follows an architectural approach focused on full control of the data flow, explicit DOM manipulation, and strict separation of responsibilities by modules. The application is organized into logical layers (core, scrambler, database, averages, UI), maintaining a single entry point and avoiding multiple implicit dependencies.

The cube model, the scramble generator, the competitive timer, and the regulated statistics system are implemented using proprietary algorithmic logic. No graphical engines or external mathematical libraries are used; the entire simulation is based on indexed structures and deterministic state transformations.

<p align="center">
  <img src="./src/multimedia/Javascript.png" width="200">
  <img src="./src/multimedia/IndexedDB.png" width="200">
</p>

For persistence, IndexedDB is used — the browser’s native database designed for structured and high-volume storage. The system defines two main object stores:

* cube3x3: stores each solve with its time, scramble, date, and penalty states.
* promDB: stores the persistent configuration of Average of X metrics (actual/best).

---

## 3. Logical modeling of the 3x3 cube

The system implements a mathematical model of a 3x3 Rubik’s Cube visually represented in 2D from a single fixed perspective: white on top and green on the front. This orientation corresponds to the standard used in official competitions to apply scrambles.

Although the representation is two-dimensional, the internal logic accurately replicates the physical behavior of a real three-dimensional cube. Each sticker is represented through classes indicating its color. Internally, the cube is not manipulated as an image, but as an indexed structure where each position represents a specific sticker.

<p align="center">
  <img src="./src/multimedia/Cubo.gif" width="400">
</p>

Movement functions operate on indices representing specific positions within that structure. When a move is executed — R, L, U, D, F, B and their inverse or double variants — the system mathematically swaps the color classes between the corresponding indices. This simulates the real rotation of the selected face and the adjacent layers affected by the turn.

As a result, the cube’s logical state always remains consistent with the physical rules of a real cube. There are no visual simplifications disconnected from the internal model; each render corresponds exactly to the current mathematical state.

---

## 4. Clean scramble generation

The scramble is generated through an algorithm that produces between 20 and 23 random moves, aligning with the standards used in competitive environments.

The generator does not produce arbitrary unrestricted sequences. It incorporates specific rules to avoid redundant or algebraically reducible patterns. For example, it avoids combinations such as R R (equivalent to R2), L L L (equivalent to L’), or parallel layer patterns such as R L R (equivalent to R2 L), which can be simplified mathematically.

These constraints ensure that each scramble is clean, non-reducible, and representative of a real competitive environment. The goal is to maintain technical integrity and avoid artificially weak scrambles.

<p align="center">
  <img src="./src/multimedia/Generador.png" width="550">
</p>

The generated scramble is inserted into an input that parses each move in real time. Every valid instruction is immediately executed on the cube render. The cube always starts from a fully solved state, and only the valid moves present in the input modify its logical and visual state.

---

## 5. Synchronization between digital and physical environment

The user executes the displayed scramble on their physical cube following official notation. The goal is for the real cube to reach the same configuration as the application render.

This synchronization ensures consistency between the physical and digital environments. The system does not solve the cube automatically nor simulate results; it reproduces the real context of competitive training where the user interacts with their own cube while the system records performance.

<p align="center">
  <img src="./src/multimedia/Digital.png" width="300">
  <img src="./src/multimedia/real.png" width="207">
</p>

---

## 6. Scramble management controls

The interface incorporates three main controls for managing the cube state and the active scramble.

The **R (Restart)** button returns the cube to its fully solved state and automatically generates a new scramble. This scramble is inserted into the input and executed immediately to render the new configuration.

<p align="center">
  <img src="./src/multimedia/Restart.gif" width="550">
</p>

The **E (Edit)** button allows manual modification of the move sequence. Any valid change in the input is reflected in real time in the cube’s logical and visual state. This enables analysis of specific cases, technical testing, or study of particular scenarios.

<p align="center">
  <img src="./src/multimedia/Editar.gif" width="550">
</p>

The **C (Copy)** button copies the currently active scramble to the clipboard in official notation. Its function is to allow the user to reuse the scramble outside the application, whether to share it, register it in another environment, repeat the same scenario in multiple sessions, or analyze it with external tools.

---

## 7. Competition-logic timer

The system incorporates a timer designed according to the logic used in official competitions.

To start it, the user must hold down the spacebar for at least **300 milliseconds** and then release it. This intentional delay prevents accidental activations and simulates the behavior of physical competition timers.

<p align="center">
  <img src="./src/multimedia/Cronometro.gif" width="600">
</p>

The time begins when the key is released and continues until the spacebar is pressed again to stop it. Once the measurement ends, the cube automatically returns to its solved state and a new scramble is generated for the next solve. This maintains a continuous training flow without additional manual resets.

---

## 8. Structured recording of each solve

Each time the timer stops, a data structure is created that formally represents the performed solve. This structure includes the recorded time, the scramble used, the date in en-US format, the cube type, and two possible penalty states: **+2** and **DNF**.

```js
	let solve = {

	time: cronometro.textContent,
	scramble: notacion.value,
	date: new Date().toLocaleString('en-US', { 
		month: 'long', 
		day: '2-digit', 
		year: 'numeric', 
		hour: 'numeric', 
		minute: '2-digit', 
		hour12: true 
	}),
	dnf: false,
	masDos: false,
	timeMasDos: Number(cronometro.textContent)+2,
	timeDNF: "DNF",
	typeCube:"3x3"
};
```

The **+2 penalty** is applied when the cube is solved but requires one additional minor move; in that case, two seconds are added to the recorded time. The **DNF penalty (Did Not Finish)** is applied when the cube is not correctly solved and requires more than one move to complete.

By default, both penalties are initialized as `false`. All this data is stored in IndexedDB within an object store called **cube3x3**, guaranteeing local persistence and offline operation.

---

## 9. Immediate rendering and penalty management

When a record is saved in the database, it is immediately rendered in a frontend table. Each row displays the time and provides controls to apply **+2**, **DNF**, or delete the solve.

If +2 is applied, the time increases by two seconds both in the frontend and in the database and visually changes to orange. If DNF is applied, the time is displayed as “DNF”, changes to red, and the corresponding field in the database is updated to `true`. The delete button removes the record from both the frontend and the **cube3x3** storage.

<p align="center">
  <img src="./src/multimedia/+2.png" width="300">
  <img src="./src/multimedia/DNF.png" width="292">
</p>

All these changes automatically impact the visible statistics, since the system recalculates metrics in real time after any modification.

---

## 10. Detailed solve overlay

Each recorded time can be selected. When clicked, an overlay opens showing a detailed view of the solve stored in the database. This view includes the recorded time, date, cube type, scramble in official notation, and a render of the corresponding cube state.

<p align="center">
  <img src="./src/multimedia/Overlay.gif" width="600">
</p>

From this overlay, penalties can also be applied, the scramble can be copied, the view can be closed, or the solve can be deleted. Any action performed is immediately synchronized with the database and the frontend, maintaining full consistency between visual state and persistence.

---

## 11. Regulated statistics system

The statistics section contains **8 main metrics** implemented under formal rules.

**Mo3** calculates the direct mean of 3 consecutive times and does not allow any DNF; if one exists, the result is DNF.

**Ao5** uses 5 times, removes the best and the worst, and averages the remaining 3. It allows a maximum of 1 DNF; if there are more, the result is DNF.

**Ao12** uses 12 times, removes the best and the worst, and averages the remaining 10, with a limit of 1 DNF.

**Ao25** removes the 2 best and 2 worst times from a set of 25 and averages the remaining 21, allowing up to 2 DNFs.

**Ao50** removes 3 best and 3 worst times and averages 44, with a limit of 3 DNFs.

**Ao100** removes 5 best and 5 worst times and averages 90, with a limit of 5 DNFs.

**Single** represents the best individual time recorded in the database, excluding any DNF.

**Mean** calculates the global average of all stored times. The DNF limit is dynamic and depends on the total number of records. If there are fewer than 100 times, the logic of the closest higher statistic is applied. For example, with 30 times the Ao50 logic is used; with 52 times they are treated as an equivalent Ao75 block with 4 DNFs, although it is not displayed in the frontend since it is used only for internal calculation. When the total exceeds 100 times, the DNF limit accumulates by blocks; for example, with 230 times two blocks of 100 (5 + 5 DNFs) and one block of 50 (3 DNFs) are added, resulting in a total limit of 13 DNFs.

<p align="center">
  <img src="./src/multimedia/Actual.gif" width="500">
</p>

All statistics are automatically recalculated in real time after any change in the records.

---

## 12. Average of X: actual vs best

Average of X statistics include a selector that allows switching between **“actual”** and **“best”**. The actual mode shows the average calculated with the last X recorded times. The best mode shows the best historical average of X times stored in the database.

<p align="center">
  <img src="./src/multimedia/Best.gif" width="500">
</p>

The selected preference is stored in a second IndexedDB object store called **promDB**. This allows each statistic to preserve the previously selected configuration when the application is restarted.

---

## 13. Data flow system, persistence and offline operation

The system implements a sequential data flow where the database acts as the **single source of truth**. Every relevant action — time recording, penalty application, or deletion — follows the same structural pattern to guarantee consistency between storage, the time table, the solve card, and the statistics.

When the timer stops, the *solve* object is constructed with all its attributes: base time, active scramble, date, and penalty states initialized (`masDos: false`, `dnf: false`). This object is immediately saved in IndexedDB within the `cube3x3` object store. Only after the write is confirmed does the rendering process execute.

First, the time table is updated by inserting the new solve linked to its persisted identifier. Then, the system recalculates all statistics using exclusively the data stored in the database, avoiding any calculations based on temporary frontend states. The detail card is not rendered automatically; it is only built or updated when the user explicitly selects a time within the table, referencing the corresponding persisted record.

Penalties (+2 and DNF) restart the same flow. When applied, the corresponding record is updated directly in IndexedDB by modifying its internal properties (`masDos`, `dnf`, and if applicable the adjusted time). These values are stored as `true` or `false` in the database, ensuring real persistence of the state. Once the update is confirmed, the modification is simultaneously reflected in the time table, the solve card, and the full recalculation of statistics. In this way, the penalty is not only visual but structural and persistent.

<p align="center">
  <img src="./src/multimedia/Diagrama.png" width="500">
</p>

Both `cube3x3` and `promDB` are stored persistently in IndexedDB, allowing times, penalties, and metrics to remain even after closing or restarting the application. When the application starts again, the system reconstructs the complete state by reading from the database and recalculating the required statistics.

The architecture follows an **offline-first approach**, without dependency on external services for its main operation, ensuring operational continuity and data consistency at all times.

---

## 14. Current state and projection

The project is currently in an active development stage. The main logic is fully implemented and functional, including the cube’s mathematical model, constrained scramble generator, competitive timing system, robust persistence, and real-time regulated statistics.

Visual aspects such as statistics overlays and general design still need refinement before the formal release. The first version will be oriented exclusively toward desktop and focused on the **3x3 cube**. Later, the system will scale by incorporating new cube types, more customizable statistics, and full adaptation for mobile devices.

---

## 15. Author

**Eloxb Developer**

Email: [eloxbdeveloper@gmail.com](mailto:eloxbdeveloper@gmail.com)

Instagram: [https://www.instagram.com/qubik.timer](https://www.instagram.com/qubik.timer)

Github: [https://github.com/Eloxbdeveloper](https://github.com/Eloxbdeveloper)

Qubik Timer is conceived both as a competitive practice tool and as a demonstration of modular frontend architecture, complex mathematical modeling, and advanced local storage management using pure JavaScript.


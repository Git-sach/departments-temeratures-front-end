import { Injectable, inject } from '@angular/core';
import { Observable, combineLatest, filter, map, switchMap } from 'rxjs';
import { Department } from 'src/app/shared/interfaces/department.interface';
import { TemperatureDepartment } from 'src/app/shared/interfaces/temperatureDepartment';
import { DepartmentsService } from 'src/app/shared/services/api/departments.service';
import { TemperatureDepartmentsService } from 'src/app/shared/services/api/temperature-departments.service';
import { DateSelectionStateService } from '../states/date-selection-state.service';
import { DepartmentsStateService } from '../states/departments-state.service';
import { TemperatureDepartmentsStateService } from '../states/temperature-departments-state.service';

@Injectable({
  providedIn: 'root',
})
export class MainDashboardFacadeService {
  //TODO: Faire deux classes distincles et faire hériter cette classe des deux autres ??

  departmentApi = inject(DepartmentsService);
  departmentsState = inject(DepartmentsStateService);

  temperatureDepartmentsApi = inject(TemperatureDepartmentsService);
  temperatureDepartmentsState = inject(TemperatureDepartmentsStateService);

  dateSelectionState = inject(DateSelectionStateService);

  // DEPARTMENT
  /**
   * Charge la liste complète des départements depuis l'API et met à jour le state des départements.
   */
  loadDepartments(): void {
    this.departmentApi
      .getAllDepartments()
      .subscribe((departments) =>
        this.departmentsState.setDepartments(departments)
      );
  }

  // DEPARTMENT
  /**
   * Obtient un Observable émettant le département actuellement sélectionné.
   *
   * @returns Un Observable émettant le département sélectionné.
   */
  getDepartments$(): Observable<Department[]> {
    return this.departmentsState.getDepartments$();
  }

  // DEPARTMENT
  getSelectedDepartment$(): Observable<Department | null> {
    return this.departmentsState.getSelectedDepatment$();
  }

  // DEPARTMENT
  /**
   * Définit le département sélectionné dans le store des départements.
   *
   * @param department Le nouveau département à définir comme département sélectionné.
   */
  setSelectedDepartment(department: Department): void {
    this.departmentsState.setSelectedDepartment(department);
  }

  // TEMPERATURE DATE
  /**
   * Obtient un Observable qui effectue un appel à l'API lorsque la date change,
   * uniquement si les températures correspondantes ne sont pas déjà stockées dans le store.
   *
   * @returns Un Observable
   */
  loadTemperaturesForSelectedDateIfNotLoaded(): Observable<void> {
    return combineLatest({
      selectedDate: this.getSelectedDate$(),
      dateOfTemperaturesLoaded:
        this.temperatureDepartmentsState.getDatesOfLoadedTemperaturesDepartments$(),
    }).pipe(
      map(({ selectedDate, dateOfTemperaturesLoaded }) => {
        if (
          !dateOfTemperaturesLoaded.includes(
            this.temperatureDepartmentsState.getDateFormatted(selectedDate)
          )
        ) {
          return this.loadTemperaturesForSelectedDate(selectedDate);
        }
      })
    );
  }

  // TEMPERATURE DATE
  /**
   * Charge les températures pour la date sélectionnée en faisant appel à l'API.
   * Les résultats obtenus sont ensuite ajoutés au state.
   *
   * @param date La date pour laquelle charger les températures.
   */
  loadTemperaturesForSelectedDate(date: Date): void {
    this.temperatureDepartmentsApi
      .getDepartmentsTemperatureForDate(date)
      .subscribe((temperatureDepartments) => {
        this.temperatureDepartmentsState.addTemperatureDepartmentForDate(
          date,
          temperatureDepartments.results
        );
      });
  }

  // TEMPERATURE DATE DEPARTMENT
  //TODO fair la methode qui prend les temps d'un dep sur 1, 2, 3 mois ? en fonction de la la date selected (moitié avnt moitié apres)
  getTemperaturesForSelectedDepartmentAndSelectedDateOverThreeMonth$(): Observable<
    TemperatureDepartment[]
  > {
    const selectedDate$ = this.getSelectedDate$();
    const department$ = this.getSelectedDepartment$();

    return selectedDate$.pipe(
      switchMap((date) => {
        console.log(date);

        return department$.pipe(
          filter((department) => department !== null),
          switchMap((department) => {
            return this.temperatureDepartmentsApi
              .getTemperaturesForDepartmentNumberAndDateInterval(
                department!.code,
                new Date('01-01-2020'),
                new Date('02-01-2020')
              )
              .pipe(map((x) => x.results));
          })
        );
      })
    );
  }

  // TEMPERATURE DATE
  /**
   * Obtient un Observable émettant les températures pour tous les départements, à la date sélectionnée.
   *
   * @returns Un Observable émettant un tableau de températures pour la date selectionnée.
   */
  getTemperatureDepartmentsForSelectedDate$(): Observable<
    TemperatureDepartment[]
  > {
    return this.getSelectedDate$().pipe(
      switchMap((date) => {
        return this.temperatureDepartmentsState.getTemperatureDepartmentsForDate$(
          date
        );
      }),
      filter((temperatureDepartments) => temperatureDepartments !== undefined)
    );
  }

  // TEMPERATURE DEPARTMENT DATE
  /**
   * Obtient un Observable émettant les températures pour le département sélectionné, à la date sélectionnée.
   *
   * @returns Un Observable émettant les températures pour le département sélectionné à la date selectionnée.
   */
  getSelectedDepartmentTemperatureForSelectedDate$(): Observable<TemperatureDepartment> {
    return combineLatest({
      departmentTemperatures: this.getTemperatureDepartmentsForSelectedDate$(),
      selectedDepartment: this.getSelectedDepartment$(),
    }).pipe(
      map(({ departmentTemperatures, selectedDepartment }) => {
        return departmentTemperatures.find(
          (TDepartment) =>
            TDepartment.code_insee_departement === selectedDepartment?.code
        )!;
      })
    );
  }

  // DATE
  /**
   * Obtient un Observable émettant la date sélectionnée.
   *
   * @returns Un Observable émettant la date sélectionnée.
   */
  getSelectedDate$(): Observable<Date> {
    return this.dateSelectionState.getSelectedDate$();
  }

  // DATE
  /**
   * Définit la date sélectionnée dans le state de la sélection de date.
   *
   * @param date La nouvelle date à définir comme date sélectionnée.
   */
  setSelectedDate(date: Date): void {
    this.dateSelectionState.setSelectedDate(date);
  }

  // DEPARTMENT TEMPERATURE DATE
  /**
   * Obtient un Observable de departements avec les températures moyennes pour la date sélectionnée.
   * Combinant les informations des départements et des températures moy
   *
   * @returns Un observable émettant la liste des départements avec les températures moyennes.
   */
  getDepartmentsWichTemperatureMoyForSelectedDate$(): Observable<Department[]> {
    const departments$ = this.getDepartments$();
    const temperatures$ = this.getTemperatureDepartmentsForSelectedDate$();

    return combineLatest([departments$, temperatures$]).pipe(
      map(([departments, temperatures]) => {
        let departmentsCopy: Department[] = JSON.parse(
          JSON.stringify(departments)
        );

        departmentsCopy.map((department) => {
          const temperatureDepartment = temperatures.find(
            (temperatureDepartment) =>
              temperatureDepartment.code_insee_departement === department.code
          );
          department.tMoy = temperatureDepartment!.tmoy;
        });
        return departmentsCopy;
      })
    );
  }
}
